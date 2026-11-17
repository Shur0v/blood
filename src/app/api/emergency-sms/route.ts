import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { encryptMedical, MedicalError, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityDigest, securityJson, securityRateLimit } from '@/src/backend/utils/security';
import { readMaintenance } from '@/src/lib/maintenanceState.server';
import { GROUPS, MAX_RECIPIENTS, renderTemplate, smsSegments } from '@/src/lib/emergencySms';
import { audit, beginSandboxDispatch, bounds, branchOpen, createRequest, defaultNotice, discoveryVisible,
  emergencyTransaction, finishDispatch, issueInvite, ownedRequest, phoneDigest, readReference, recipients,
  requireSandbox, sandboxEnabled, scopedAccess } from '@/src/backend/services/emergencySms';

const id = z.uuid();
const language = z.enum(['bn', 'en']);
const expiry = z.iso.datetime().optional();
const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), branch: id, reference: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{2,39}$/), group: z.enum(GROUPS), component: z.enum(['WHOLE_BLOOD','RED_CELLS','PLATELETS','PLASMA']), neededAt: z.iso.datetime() }),
  z.object({ action: z.literal('start'), id, funding: z.enum(['PILOT','PAID']), count: z.number().int().min(1).max(50) }),
  z.object({ action: z.literal('consent'), latitude: z.number().min(20.5).max(26.7), longitude: z.number().min(88).max(92.8), language, available: z.boolean(), agree: z.literal(true) }),
  z.object({ action: z.literal('withdraw') }),
  z.object({ action: z.literal('respond'), delivery: id, response: z.enum(['INTERESTED','DECLINED']) }),
  z.object({ action: z.literal('accept'), token: z.string().regex(/^[\w-]{43}$/) }),
  z.object({ action: z.literal('invite'), branch: id, email: z.email().max(254), role: z.enum(['VERIFIER','DISPATCH','CAMPAIGN']), expiresAt: expiry }),
  z.object({ action: z.literal('revoke'), branch: id, access: id }),
  z.object({ action: z.literal('operate'), id, step: z.enum(['VERIFY','REJECT','STOP','SECOND','CONFIRM']) }),
]);

const result = (data: unknown, status = 200) => NextResponse.json({ data }, { status, headers: privateHeaders });
const failure = (error: unknown) => result({ error: error instanceof MedicalError ? error.message : 'অনুরোধটি সম্পন্ন করা যায়নি।' }, error instanceof MedicalError ? error.status : 500);

async function account(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== USER_ROLE) throw new MedicalError('BloodNet অ্যাকাউন্টে প্রবেশ করুন।', 401);
  const db = getPrisma();
  const [user, restricted] = await Promise.all([
    db.user.findUnique({ where: { id: session.user_id }, select: { id: true } }),
    db.restrictedIdentity.findFirst({ where: { user_id: session.user_id, is_active: true }, select: { id: true } }),
  ]);
  if (!user) throw new MedicalError('BloodNet অ্যাকাউন্টে প্রবেশ করুন।', 401);
  if (restricted) throw new MedicalError('এই অ্যাকাউন্টে প্রবেশাধিকার সীমিত।', 403);
  return user.id;
}
function safeWrite(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || ![new URL(req.url).origin, new URL(getPublicBaseUrl()).origin].includes(origin))
    throw new MedicalError('Invalid request origin.', 403);
  if (readMaintenance().enabled) throw new MedicalError('পরিষেবায় রক্ষণাবেক্ষণ চলছে।', 503);
}

export async function GET(req: Request) {
  try {
    const enabled = sandboxEnabled();
    const mode = new URL(req.url).searchParams.get('view') || 'catalog';
    if (mode === 'catalog') {
      if (!enabled) return result({ enabled });
      const db = getPrisma();
      const visible = await discoveryVisible(db);
      const branches = visible ? await db.emergencySmsBranch.findMany({
        where: { active: true }, orderBy: { name: 'asc' }, take: 100,
      }) : [];
      return result({ enabled: true, visible, sandbox: true, notice: defaultNotice, ...bounds,
        branches: branches.filter(branch => branchOpen(branch, new Date())).map(({ id, name, area, contact }) => ({ id, name, area, contact })) });
    }
    const userId = await account(req);
    const db = getPrisma();
    if (mode === 'detail') {
      const request = await ownedRequest(db, id.parse(new URL(req.url).searchParams.get('id')), userId);
      const branch = await db.emergencySmsBranch.findUniqueOrThrow({ where: { id: request.branch_id } });
      const open = enabled && await discoveryVisible(db) && branchOpen(branch, new Date()) &&
        request.status === 'VERIFIED' && request.needed_at > new Date();
      const [paid, pilot, deliveries] = await Promise.all([
        open ? recipients(db, request, branch, new Date(), MAX_RECIPIENTS) : [],
        open ? recipients(db, request, branch, new Date(), Math.min(20, branch.sponsor_remaining)) : [],
        db.emergencySmsDelivery.groupBy({ by: ['status','response'], where: { request_id: request.id }, _count: true }),
      ]);
      const snapshot: { bn?: string; en?: string } = request.template_version?.startsWith('{') ? JSON.parse(request.template_version) : {};
      const templates = await db.emergencySmsTemplate.findMany({ where: request.template_version
        ? { id: { in: [snapshot.bn, snapshot.en].filter((item): item is string => Boolean(item)) } }
        : { status: 'PUBLISHED' }, orderBy: { published_at: 'desc' } });
      const preview = (language: string) => renderTemplate(language, branch.name, branch.area, request.blood_group,
        request.needed_at, 'https://bloodnet.live/…', templates.find(item => item.language === language)?.body);
      return result({ sandbox: true, id: request.id, hospital: branch.name, neededAt: request.needed_at,
        status: request.status, funding: request.funding, charged: request.charged_paisa, refunded: request.refund_paisa,
        paidCount: paid.length, pilotCount: pilot.length, coverage: request.covered_count, deliveries,
        previewBn: preview('bn'), previewSegmentsBn: smsSegments(preview('bn')),
        previewEn: preview('en'), previewSegmentsEn: smsSegments(preview('en')) });
    }

    if (mode === 'workspace') {
      const access = await db.emergencySmsAccess.findMany({ where: { accepted_user_id: userId, accepted_at: { not: null },
        revoked_at: null, OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] },
        select: { branch_id: true, role: true, Branch: { select: { name: true } } } });
      const operational = access.filter(row => ['BRANCH_ADMIN','VERIFIER','DISPATCH'].includes(row.role));
      const rows = await db.emergencySmsRequest.findMany({
        where: { branch_id: { in: operational.map(row => row.branch_id) } }, orderBy: { created_at: 'desc' }, take: 100,
        select: { id: true, branch_id: true, reference: true, status: true, blood_group: true, component: true, needed_at: true, funding: true },
      });
      const finance = await db.emergencySmsRequest.findMany({
        where: { branch_id: { in: access.filter(row => row.role === 'FINANCE').map(row => row.branch_id) } },
        orderBy: { created_at: 'desc' }, take: 100, select: { id: true, charged_paisa: true, refund_paisa: true, status: true },
      });
      const staff = await db.emergencySmsAccess.findMany({
        where: { branch_id: { in: access.filter(row => row.role === 'BRANCH_ADMIN').map(row => row.branch_id) }, role: { in: ['VERIFIER','DISPATCH','CAMPAIGN'] } },
        select: { id: true, branch_id: true, role: true, email: true, accepted_at: true, revoked_at: true }, take: 100,
      });
      return result({ access, finance, staff, rows: rows.map(({ reference, ...row }) => ({
        ...row, reference: readReference({ branch_id: row.branch_id, reference }),
      })) });
    }
    if (mode !== 'account') throw new MedicalError('Invalid view.');
    const [history, inbox, consent] = await Promise.all([
      db.emergencySmsRequest.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 30,
        select: { id: true, status: true, created_at: true, Branch: { select: { name: true } } } }),
      db.emergencySmsDelivery.findMany({ where: { donor_id: userId }, orderBy: { created_at: 'desc' }, take: 20,
        select: { id: true, response: true, Request: { select: { status: true, needed_at: true, blood_group: true,
          Branch: { select: { name: true, area: true } } } } } }),
      db.emergencySmsConsent.findUnique({ where: { user_id: userId }, select: { available: true, confirmed_at: true, language: true } }),
    ]);
    return result({ enabled, history, inbox, consent });
  } catch (error) { return failure(error instanceof z.ZodError ? new MedicalError('Invalid request.') : error); }
}

export async function POST(req: Request) {
  try {
    safeWrite(req);
    const userId = await account(req);
    await securityRateLimit('emergency-sms-action', userId, 35, 60_000);
    const parsed = mutation.safeParse(await securityJson(req, 4096));
    if (!parsed.success) throw new MedicalError('দেওয়া তথ্য পরীক্ষা করুন।');
    const input = parsed.data;
    if (!['withdraw','revoke'].includes(input.action)) requireSandbox();
    return await emergencyTransaction(async db => {
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, mobile: true } });
      if (!user) throw new MedicalError('অ্যাকাউন্ট পাওয়া যায়নি।', 401);
      const email = user.email.toLowerCase();
      if (input.action === 'create') {
        if (!await discoveryVisible(db)) throw new MedicalError('নতুন অনুরোধ বন্ধ আছে।', 503);
        const requestId = await createRequest(db, userId, { ...input, neededAt: new Date(input.neededAt) });
        return result({ id: requestId });
      }
      if (input.action === 'start') {
        await beginSandboxDispatch(db, await ownedRequest(db, input.id, userId), input.funding, input.count);
      } else if (input.action === 'consent') {
        const digest = phoneDigest(user.mobile);
        if (!digest) throw new MedicalError('অ্যাকাউন্টে বৈধ বাংলাদেশি মোবাইল নম্বর প্রয়োজন।');
        const point = encryptMedical(Buffer.from(JSON.stringify({ latitude: input.latitude, longitude: input.longitude })), 'emergency-point:' + userId);
        await db.emergencySmsConsent.upsert({ where: { user_id: userId },
          create: { user_id: userId, phone_digest: digest, point, language: input.language, available: input.available },
          update: { phone_digest: digest, point, language: input.language, available: input.available, confirmed_at: new Date() } });
        await audit(db, userId, 'SANDBOX_CONSENT');
      } else if (input.action === 'withdraw') {
        await db.emergencySmsConsent.updateMany({ where: { user_id: userId }, data: { available: false } });
        await audit(db, userId, 'CONSENT_WITHDRAWN');
      } else if (input.action === 'respond') {
        const now = new Date();
        const updated = await db.emergencySmsDelivery.updateMany({ where: {
          id: input.delivery, donor_id: userId, Request: { needed_at: { gt: now }, status: { in: ['QUEUED','DISPATCH_COMPLETE'] } },
        }, data: { response: input.response } });
        if (!updated.count) throw new MedicalError('এই অনুরোধ আর সক্রিয় নেই।', 409);
      } else if (input.action === 'accept') {
        const accepted = await db.emergencySmsAccess.updateMany({ where: {
          email, invite_digest: securityDigest('emergency-invite:' + input.token), invite_expires: { gt: new Date() },
          revoked_at: null, OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        }, data: { accepted_at: new Date(), accepted_user_id: userId, invite_digest: null } });
        if (!accepted.count) throw new MedicalError('আমন্ত্রণটি বৈধ নয়।', 403);
        await audit(db, userId, 'INVITE_ACCEPTED');
      } else if (input.action === 'invite') {
        await scopedAccess(db, userId, input.branch, ['BRANCH_ADMIN']);
        const token = await issueInvite(db, input.branch, input.email.toLowerCase(), input.role, input.expiresAt ? new Date(input.expiresAt) : null);
        await audit(db, userId, 'INVITE_ISSUED', input.branch);
        return result({ token });
      } else if (input.action === 'revoke') {
        await scopedAccess(db, userId, input.branch, ['BRANCH_ADMIN']);
        await db.emergencySmsAccess.updateMany({ where: { id: input.access, branch_id: input.branch, role: { in: ['VERIFIER','DISPATCH','CAMPAIGN'] } },
          data: { revoked_at: new Date(), invite_digest: null } });
        await audit(db, userId, 'ACCESS_REVOKED', input.branch);
      } else {
        const request = await db.emergencySmsRequest.findUnique({ where: { id: input.id } });
        if (!request) throw new MedicalError('অনুরোধটি পাওয়া যায়নি।', 404);
        const allowed = input.step === 'SECOND' ? ['DISPATCH','BRANCH_ADMIN']
          : input.step === 'STOP' ? ['DISPATCH','VERIFIER','BRANCH_ADMIN'] : ['VERIFIER','BRANCH_ADMIN'];
        await scopedAccess(db, userId, request.branch_id, allowed);
        if (input.step === 'SECOND') {
          const batch = await db.emergencySmsDelivery.count({ where: { request_id: request.id } });
          if (request.status !== 'QUEUED' || request.funding !== 'PILOT' || !batch || request.pilot_second_approved ||
              !request.next_batch_at || request.next_batch_at > new Date() || request.needed_at <= new Date())
            throw new MedicalError('দ্বিতীয় ব্যাচ এখনও প্রস্তুত নয়।', 409);
          await db.emergencySmsRequest.update({ where: { id: request.id }, data: { pilot_second_approved: true } });
        } else {
          const permitted = { VERIFY: ['PENDING'], REJECT: ['PENDING','VERIFIED'],
            STOP: ['PENDING','VERIFIED','QUEUED','DISPATCH_COMPLETE'], CONFIRM: ['QUEUED','DISPATCH_COMPLETE','STOPPED'] };
          const target = { VERIFY: 'VERIFIED', REJECT: 'REJECTED', STOP: 'STOPPED', CONFIRM: 'HOSPITAL_CONFIRMED' };
          if (!permitted[input.step].includes(request.status) || (input.step === 'VERIFY' && request.needed_at <= new Date()))
            throw new MedicalError('এই অবস্থায় পরিবর্তন সম্ভব নয়।', 409);
          await finishDispatch(db, request, target[input.step]);
        }
        await audit(db, userId, input.step, request.branch_id, request.id);
      }
      return result({ ok: true });
    });
  } catch (error) { return failure(error); }
}
