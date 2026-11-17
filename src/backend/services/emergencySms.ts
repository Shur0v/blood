import { randomBytes } from 'node:crypto';
import type { Prisma, EmergencySmsBranch, EmergencySmsRequest } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getPrisma } from '../config/db';
import { MedicalError, decryptMedical, encryptMedical } from '../utils/medicalPrivacy';
import { securityDigest } from '../utils/security';
import { BATCH_DELAY_MS, BATCH_SIZE, CONSENT_AGE_MS, CONTACT_INTERVAL_MS, MAX_RECIPIENTS,
  PRICE_PAISA, RADIUS_KM, TEMPLATE_VERSION, selectRecipients } from '@/src/lib/emergencySms';

export type Tx = Prisma.TransactionClient;
export const sandboxEnabled = () => process.env.EMERGENCY_SMS_MODE === 'sandbox';
export const roles = ['BRANCH_ADMIN', 'VERIFIER', 'DISPATCH', 'FINANCE', 'CAMPAIGN'] as const;
export const defaultNotice = 'পরীক্ষামূলক মোড। টাকা কাটা বা মোবাইলে এসএমএস পাঠানো হবে না।';

export function requireSandbox() {
  if (!sandboxEnabled()) throw new MedicalError('জরুরি এসএমএস এখন চালু নেই।', 503);
}

export async function emergencyTransaction<T>(run: (db: Tx) => Promise<T>) {
  return getPrisma().$transaction(async db => {
    // Serialize the small pilot workload, including funding, opt-outs and batch allocation.
    await db.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(28677294)) gate`;
    return run(db);
  }, { timeout: 15_000 });
}

export function bdPhone(value: string) {
  const number = parsePhoneNumberFromString(value, 'BD');
  return number?.country === 'BD' && number.isValid() && /^\+8801[3-9]\d{8}$/.test(number.number)
    ? number.number : null;
}

export function phoneDigest(value: string) {
  const number = bdPhone(value);
  return number ? securityDigest('emergency-phone:' + number) : null;
}

export async function audit(db: Tx, actor: string, event: string, branch?: string, request?: string) {
  await db.emergencySmsAudit.create({ data: { actor_id: actor, event, branch_id: branch, request_id: request } });
}

export async function discoveryVisible(db: Tx) {
  const row = await db.platformSettings.findFirst({
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }], select: { discovery_visible: true },
  });
  return row?.discovery_visible ?? true;
}

export function branchOpen(branch: EmergencySmsBranch, now: Date) {
  const minute = (now.getUTCHours() * 60 + now.getUTCMinutes() + 360) % 1440;
  const { opens_minute: start, closes_minute: end } = branch;
  return branch.active && (start < end ? minute >= start && minute < end : minute >= start || minute < end);
}

export async function ownedRequest(db: Tx, id: string, owner: string) {
  const request = await db.emergencySmsRequest.findFirst({ where: { id, user_id: owner } });
  if (!request) throw new MedicalError('অনুরোধটি পাওয়া যায়নি।', 404);
  return request;
}

export async function scopedAccess(db: Tx, userId: string, branch: string, allowed: readonly string[]) {
  const access = await db.emergencySmsAccess.findFirst({ where: {
    branch_id: branch, accepted_user_id: userId, role: { in: [...allowed] }, accepted_at: { not: null },
    revoked_at: null, OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
  }, select: { id: true } });
  if (!access) throw new MedicalError('এই শাখায় আপনার অনুমতি নেই।', 403);
}

export async function issueInvite(db: Tx, branch: string, email: string, role: string, expires: Date | null) {
  const token = randomBytes(32).toString('base64url');
  const data = { invite_digest: securityDigest('emergency-invite:' + token),
    invite_expires: new Date(Date.now() + 86400_000), expires_at: expires, accepted_user_id: null, accepted_at: null, revoked_at: null };
  await db.emergencySmsAccess.upsert({
    where: { branch_id_email_role: { branch_id: branch, email, role } },
    create: { branch_id: branch, email, role, ...data }, update: data,
  });
  return token;
}

export function readReference(request: Pick<EmergencySmsRequest, "reference" | "branch_id">) {
  return decryptMedical(request.reference, 'emergency-reference:' + request.branch_id).toString();
}

export async function createRequest(db: Tx, user: string, info: {
  branch: string; reference: string; group: string; component: string; neededAt: Date;
}) {
  const now = new Date();
  if (info.neededAt <= now || info.neededAt.getTime() - now.getTime() > 7 * 86400_000)
    throw new MedicalError('পরবর্তী সাত দিনের মধ্যে প্রয়োজনের সময় নির্বাচন করুন।');
  const branch = await db.emergencySmsBranch.findUnique({ where: { id: info.branch } });
  if (!branch || !branchOpen(branch, now)) throw new MedicalError('এই শাখা এখন অনুরোধ গ্রহণ করছে না।', 409);
  const referenceDigest = securityDigest('emergency-reference:' + info.branch + ':' + info.reference.toLowerCase());
  const existing = await db.emergencySmsRequest.findUnique({ where: {
    branch_id_reference_digest: { branch_id: info.branch, reference_digest: referenceDigest },
  } });
  if (existing?.user_id === user) return existing.id;
  if (existing) throw new MedicalError('এই হাসপাতাল রেফারেন্স দিয়ে একটি অনুরোধ রয়েছে।', 409);
  const request = await db.emergencySmsRequest.create({ data: {
    user_id: user, branch_id: info.branch, reference_digest: referenceDigest,
    reference: encryptMedical(Buffer.from(info.reference), 'emergency-reference:' + info.branch),
    blood_group: info.group, component: info.component, needed_at: info.neededAt,
  } });
  await audit(db, user, 'REQUEST_CREATED', branch.id, request.id);
  return request.id;
}

export async function recipients(db: Tx, request: EmergencySmsRequest, branch: EmergencySmsBranch, now: Date, limit: number) {
  const before = new Date(now.getTime() - CONTACT_INTERVAL_MS);
  const [consents, sent] = await Promise.all([
    db.emergencySmsConsent.findMany({
      where: {
        available: true, confirmed_at: { gte: new Date(now.getTime() - CONSENT_AGE_MS) },
        OR: [{ last_contact_at: null }, { last_contact_at: { lte: before } }],
        User: { is_active_donor: true, blood_group: request.blood_group },
      },
      select: { user_id: true, phone_digest: true, point: true, language: true, last_contact_at: true, User: { select: { mobile: true } } },
    }),
    db.emergencySmsDelivery.findMany({ where: { request_id: request.id }, select: { phone_digest: true } }),
  ]);
  const sentNumbers = new Set(sent.map(row => row.phone_digest));
  const restricted = consents.length ? await db.restrictedIdentity.findMany({
    where: { is_active: true, user_id: { in: consents.map(row => row.user_id) } }, select: { user_id: true },
  }) : [];
  const restrictedUsers = new Set(restricted.map(row => row.user_id));
  return selectRecipients(branch, consents.flatMap(row => {
    if (restrictedUsers.has(row.user_id)) return [];
    if (sentNumbers.has(row.phone_digest) || phoneDigest(row.User.mobile) !== row.phone_digest) return [];
    const point = JSON.parse(decryptMedical(row.point, 'emergency-point:' + row.user_id).toString());
    return [{ ...point, userId: row.user_id, phoneDigest: row.phone_digest,
      lastContact: row.last_contact_at?.getTime() ?? null, language: row.language }];
  }), limit);
}

export async function beginSandboxDispatch(db: Tx, request: EmergencySmsRequest, funding: 'PILOT' | 'PAID', confirmedCount: number) {
  requireSandbox();
  const now = new Date();
  if (request.funding) return;
  if (request.status !== 'VERIFIED' || request.needed_at <= now)
    throw new MedicalError('যাচাইকৃত ও সক্রিয় অনুরোধ প্রয়োজন।', 409);
  const branch = await db.emergencySmsBranch.findUniqueOrThrow({ where: { id: request.branch_id } });
  if (!branchOpen(branch, now) || !await discoveryVisible(db))
    throw new MedicalError('শাখাটি এখন নতুন প্রেরণ গ্রহণ করছে না।', 409);
  const limit = funding === 'PILOT' ? Math.min(20, branch.sponsor_remaining) : MAX_RECIPIENTS;
  const count = (await recipients(db, request, branch, now, limit)).length;
  if (!count || count !== confirmedCount) throw new MedicalError('কভারেজ বদলেছে। আবার যাচাই করুন।', 409);
  if (funding === 'PILOT') await db.emergencySmsBranch.update({
    where: { id: branch.id }, data: { sponsor_remaining: { decrement: count } },
  });
  const published = await db.emergencySmsTemplate.findMany({
    where: { status: 'PUBLISHED' }, select: { language: true, id: true }, orderBy: { published_at: 'desc' },
  });
  const snapshot = JSON.stringify({ default: TEMPLATE_VERSION, bn: published.find(item => item.language === 'bn')?.id, en: published.find(item => item.language === 'en')?.id });
  await db.emergencySmsRequest.update({ where: { id: request.id }, data: {
    funding, status: 'QUEUED', charged_paisa: funding === 'PAID' ? PRICE_PAISA : 0,
    covered_count: count, template_version: snapshot, next_batch_at: now,
  } });
  await audit(db, request.user_id ?? 'account-removed', 'SIMULATION_QUEUED', branch.id, request.id);
}

export async function finishDispatch(db: Tx, request: EmergencySmsRequest, status: string) {
  const sent = await db.emergencySmsDelivery.count({ where: { request_id: request.id } });
  if (request.next_batch_at && request.funding === 'PILOT' && request.covered_count > sent) {
    await db.emergencySmsBranch.update({ where: { id: request.branch_id },
      data: { sponsor_remaining: { increment: request.covered_count - sent } } });
  }
  await db.emergencySmsRequest.update({ where: { id: request.id },
    data: { status, next_batch_at: null, refund_paisa: request.charged_paisa && !sent ? request.charged_paisa : 0 } });
}

export async function runSandboxBatch(now = new Date()) {
  if (!sandboxEnabled()) return false;
  return emergencyTransaction(async db => {
    const visible = await discoveryVisible(db);
    const request = await db.emergencySmsRequest.findFirst({
      where: {
        status: 'QUEUED',
        ...(visible ? { OR: [{ needed_at: { lte: now } }, { Branch: { active: false } }, {
          next_batch_at: { lte: now }, OR: [{ funding: 'PAID' }, { pilot_second_approved: true }, { deliveries: { none: {} } }],
        }] } : {}),
      }, orderBy: [{ next_batch_at: 'asc' }, { id: 'asc' }], include: { Branch: true },
    });
    if (!request) return false;
    if (!branchOpen(request.Branch, now) || now >= request.needed_at || !visible) {
      await finishDispatch(db, request, 'STOPPED');
      await audit(db, 'worker', 'SIMULATION_STOPPED', request.branch_id, request.id);
      return true;
    }
    const sent = await db.emergencySmsDelivery.count({ where: { request_id: request.id } });
    const batch = await recipients(db, request, request.Branch, now, Math.min(BATCH_SIZE, request.covered_count - sent));
    if (batch.length) {
      await db.emergencySmsDelivery.createMany({ data: batch.map(donor => ({
        request_id: request.id, donor_id: donor.userId, phone_digest: donor.phoneDigest,
        language: donor.language, status: 'SIMULATED',
      })) });
      await db.emergencySmsConsent.updateMany({
        where: { user_id: { in: batch.map(donor => donor.userId) } }, data: { last_contact_at: now },
      });
    }
    if (sent + batch.length >= request.covered_count || !batch.length)
      await finishDispatch(db, request, 'DISPATCH_COMPLETE');
    else
      await db.emergencySmsRequest.update({ where: { id: request.id }, data: { next_batch_at: new Date(now.getTime() + BATCH_DELAY_MS) } });
    await audit(db, 'worker', 'SIMULATION_BATCH', request.branch_id, request.id);
    return true;
  });
}

export const bounds = { radius: RADIUS_KM, price: PRICE_PAISA, limit: MAX_RECIPIENTS };
