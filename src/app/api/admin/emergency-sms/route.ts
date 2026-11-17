import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { MedicalError, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityJson } from '@/src/backend/utils/security';
import { reauthenticateAdmin } from '@/src/backend/services/adminReauthentication';
import { audit, emergencyTransaction, finishDispatch, issueInvite, requireSandbox, roles, sandboxEnabled } from '@/src/backend/services/emergencySms';
import { readMaintenance } from '@/src/lib/maintenanceState.server';
import { validTemplateBody } from '@/src/lib/emergencySms';

const reply = (data: unknown) => NextResponse.json({ data }, { headers: privateHeaders });
const label = z.string().trim().min(2).max(100).regex(/^[\p{L}\p{M}\p{N}\s.,()&'-]+$/u);
const fields = { password: z.string().min(1).max(1024) };
const bodySchema = z.discriminatedUnion('action', [
  z.object({ ...fields, action: z.literal('branch'), id: z.uuid().optional(),
    name: label, area: label, contact: z.string().regex(/^\+880\d{8,10}$/),
    latitude: z.number().min(20.5).max(26.7), longitude: z.number().min(88).max(92.8),
    opens: z.number().int().min(0).max(1439), closes: z.number().int().min(1).max(1440),
    active: z.boolean(), addCredits: z.number().int().min(0).max(5000) }),
  z.object({ ...fields, action: z.literal('invite'), branch: z.uuid(), email: z.email().max(254), role: z.enum(roles), expiresAt: z.iso.datetime().optional() }),
  z.object({ ...fields, action: z.literal('revoke'), access: z.uuid() }),
  z.object({ ...fields, action: z.literal('pause'), branch: z.uuid() }),
  z.object({ ...fields, action: z.literal('exportFinance') }),
  z.object({ ...fields, action: z.literal('draftTemplate'), language: z.enum(['bn','en']), body: z.string().trim().min(25).max(380).refine(validTemplateBody) }),
  z.object({ ...fields, action: z.literal('publishTemplate'), template: z.uuid() }),
]);

export const GET = withActiveAdmin(async () => {
  const db = getPrisma();
  const [branches, access, requests, events, deliveries, templates] = await Promise.all([
    db.emergencySmsBranch.findMany({ orderBy: { created_at: 'desc' }, take: 100 }),
    db.emergencySmsAccess.findMany({ orderBy: { invite_expires: 'desc' }, take: 100,
      select: { id: true, branch_id: true, email: true, role: true, invite_expires: true, expires_at: true, accepted_at: true, revoked_at: true } }),
    db.emergencySmsRequest.findMany({ orderBy: { created_at: 'desc' }, take: 100,
      select: { id: true, branch_id: true, status: true, funding: true, charged_paisa: true, refund_paisa: true,
        covered_count: true, created_at: true, needed_at: true, _count: { select: { deliveries: true } } } }),
    db.emergencySmsAudit.findMany({ orderBy: { created_at: 'desc' }, take: 100 }),
    db.emergencySmsDelivery.groupBy({ by: ['status','response'], _count: true }),
    db.emergencySmsTemplate.findMany({ orderBy: { created_at: 'desc' }, take: 30 }),
  ]);
  return reply({ enabled: sandboxEnabled(), branches, access, requests, events, deliveries, templates });
});

export const POST = withActiveAdmin(async req => {
  const origin = req.headers.get('origin');
  if (!origin || ![new URL(req.url).origin, new URL(getPublicBaseUrl()).origin].includes(origin))
    throw new MedicalError('Invalid request origin.', 403);
  if (readMaintenance().enabled) throw new MedicalError('Maintenance in progress.', 503);
  const parsed = bodySchema.safeParse(await securityJson(req, 4096));
  if (!parsed.success) throw new MedicalError('দেওয়া তথ্য পরীক্ষা করুন।');
  const input = parsed.data;
  const actor = await reauthenticateAdmin(req, input.password);
  if (!['revoke','pause','exportFinance'].includes(input.action)) requireSandbox();
  return emergencyTransaction(async db => {
    if (input.action === 'exportFinance') {
      const rows = await db.emergencySmsRequest.findMany({
        where: { charged_paisa: { gt: 0 } }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 10000,
        select: { id: true, branch_id: true, status: true, charged_paisa: true, refund_paisa: true, created_at: true },
      });
      const csv = ['request_id,branch_id,status,charge_paisa,refund_paisa,created_at',
        ...rows.map(row => [row.id, row.branch_id, row.status, row.charged_paisa, row.refund_paisa, row.created_at.toISOString()].join(',')),
      ].join('\r\n');
      await audit(db, actor.user_id, 'SIMULATION_FINANCE_EXPORTED');
      return reply({ csv });
    }
    if (input.action === 'draftTemplate') {
      const template = await db.emergencySmsTemplate.create({ data: { language: input.language, body: input.body } });
      await audit(db, actor.user_id, 'TEMPLATE_DRAFTED');
      return reply({ id: template.id });
    }
    if (input.action === 'publishTemplate') {
      const template = await db.emergencySmsTemplate.findUniqueOrThrow({ where: { id: input.template } });
      if (template.status !== 'PUBLISHED') {
        await db.emergencySmsTemplate.updateMany({ where: { language: template.language, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } });
        await db.emergencySmsTemplate.update({ where: { id: template.id }, data: { status: 'PUBLISHED', published_at: new Date() } });
        await audit(db, actor.user_id, 'TEMPLATE_PUBLISHED');
      }
      return reply({ ok: true });
    }
    if (input.action === 'branch') {
      const data = { name: input.name, area: input.area, contact: input.contact, latitude: input.latitude, longitude: input.longitude,
        active: input.active, opens_minute: input.opens, closes_minute: input.closes };
      if (input.opens === input.closes) throw new MedicalError('সেবার শুরু ও শেষের সময় আলাদা দিন।');
      const branch = input.id ? await db.emergencySmsBranch.update({ where: { id: input.id },
        data: { ...data, sponsor_remaining: { increment: input.addCredits } } })
        : await db.emergencySmsBranch.create({ data: { ...data, sponsor_remaining: input.addCredits } });
      await audit(db, actor.user_id, 'BRANCH_SAVED', branch.id);
      return reply({ id: branch.id });
    }
    if (input.action === 'pause') {
      await db.emergencySmsBranch.update({ where: { id: input.branch }, data: { active: false } });
      const jobs = await db.emergencySmsRequest.findMany({ where: { branch_id: input.branch, status: 'QUEUED' } });
      for (const job of jobs) await finishDispatch(db, job, 'STOPPED');
      await audit(db, actor.user_id, 'BRANCH_PAUSED', input.branch);
    } else if (input.action === 'revoke') {
      const access = await db.emergencySmsAccess.update({ where: { id: input.access }, data: { revoked_at: new Date(), invite_digest: null } });
      await audit(db, actor.user_id, 'ACCESS_REVOKED', access.branch_id);
    } else {
      const token = await issueInvite(db, input.branch, input.email.toLowerCase(), input.role, input.expiresAt ? new Date(input.expiresAt) : null);
      await audit(db, actor.user_id, 'INVITE_ISSUED', input.branch);
      return reply({ token });
    }
    return reply({ ok: true });
  });
});
