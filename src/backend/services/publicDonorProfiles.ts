import { randomUUID } from 'node:crypto';
import { getPrisma } from '../config/db';
import { MedicalError } from '../utils/medicalPrivacy';
import { toLocationSlug } from '../utils/locationSlug';

export const PUBLIC_PROFILE_CONSENT_VERSION = '2026-10-16-v1';

// Explicit field selection keeps email, patient IDs, DOB and medical records out of public pages.
const donorSelection = { name: true, mobile: true, blood_group: true, location_city: true, location_country: true } as const;

export async function getPublicDonorProfile(slug: string) {
  const row = await getPrisma().publicDonorProfile.findFirst({
    where: { slug, is_published: true, consent_version: PUBLIC_PROFILE_CONSENT_VERSION, consented_at: { not: null }, User: { is_active_donor: true } },
    select: { slug: true, bio: true, phone_visible: true, phone_consented_at: true, updated_at: true, user_id: true, User: { select: donorSelection } },
  });
  if (!row || await getPrisma().restrictedIdentity.findFirst({ where: { user_id: row.user_id, is_active: true }, select: { id: true } })) return null;
  return { slug: row.slug, bio: row.bio, name: row.User.name, bloodGroup: row.User.blood_group, city: row.User.location_city, country: row.User.location_country,
    phone: row.phone_visible && row.phone_consented_at ? row.User.mobile : null, updatedAt: row.updated_at };
}

export async function listPublicDonorProfiles(take = 60, cursor?: string) {
  const restricted = await getPrisma().restrictedIdentity.findMany({ where: { is_active: true, user_id: { not: null } }, select: { user_id: true } });
  return getPrisma().publicDonorProfile.findMany({ where: { is_published: true, consent_version: PUBLIC_PROFILE_CONSENT_VERSION, consented_at: { not: null }, user_id: { notIn: restricted.map(row => row.user_id!).filter(Boolean) }, User: { is_active_donor: true } },
    select: { id: true, slug: true, updated_at: true, User: { select: { name: true, location_city: true, location_country: true } } }, orderBy: [{ updated_at: 'desc' }, { id: 'desc' }], take: Math.min(take, 50000), ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
}

export async function getPublicProfileSettings(userId: string) {
  const row = await getPrisma().publicDonorProfile.findUnique({ where: { user_id: userId } });
  return { isPublished: row?.is_published ?? false, showPhone: row?.phone_visible ?? false, bio: row?.bio ?? '', publicPath: row ? `/donors/${row.slug}` : null, consentVersion: row?.consent_version ?? null };
}

export async function savePublicProfileSettings(userId: string, data: { isPublished: boolean; showPhone: boolean; bio: string; consent?: boolean; phoneConsent?: boolean }) {
  return getPrisma().$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`public-profile:${userId}`}, 0))`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true, is_active_donor: true } });
    if (!user) throw new MedicalError('Account not found.', 404);
    const current = await tx.publicDonorProfile.findUnique({ where: { user_id: userId } });
    if (data.isPublished) {
      if (data.bio.length > 1200 || /(?:https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\d[\s().+\-]*){8,})/i.test(data.bio)) throw new MedicalError('Keep phone numbers, email addresses and web links out of your introduction. Use the separate phone publication option.');
      if (data.bio.trim().length < 80) throw new MedicalError('Write at least 80 characters about your volunteering preferences before publishing.');
      if (!user.is_active_donor) throw new MedicalError('Make your donor status active before publishing a donor profile.');
      if (await tx.restrictedIdentity.findFirst({ where: { user_id: userId, is_active: true }, select: { id: true } })) throw new MedicalError('This account cannot publish a donor profile.', 403);
      if ((!current?.is_published || current.consent_version !== PUBLIC_PROFILE_CONSENT_VERSION) && !data.consent) throw new MedicalError('Please confirm that your name, blood group, city and country may appear publicly and in search results.');
      if (data.showPhone && (!current?.phone_visible || !current.phone_consented_at) && !data.phoneConsent) throw new MedicalError('Please separately confirm public search-engine visibility for your phone number.');
    }
    if (!data.isPublished && !current) return;
    const now = new Date();
    const settings = { is_published: data.isPublished, phone_visible: data.isPublished && data.showPhone, bio: data.bio,
      consent_version: data.isPublished ? PUBLIC_PROFILE_CONSENT_VERSION : current?.consent_version,
      consented_at: data.isPublished && data.consent ? now : current?.consented_at,
      phone_consented_at: data.isPublished && data.showPhone && data.phoneConsent ? now : current?.phone_consented_at,
      withdrawn_at: data.isPublished ? null : now };
    await tx.publicDonorProfile.upsert({ where: { user_id: userId }, update: settings,
      create: { user_id: userId, slug: `${toLocationSlug(user.name).slice(0,100) || 'volunteer'}-${randomUUID().slice(0,12)}`, ...settings } });
  });
}
