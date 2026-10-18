import { randomUUID } from 'node:crypto';
import { getPrisma } from '../config/db';
import { MedicalError } from '../utils/medicalPrivacy';
import { toLocationSlug } from '../utils/locationSlug';
import { ADMIN_ROLES } from '../utils/session';

// Explicit field selection keeps email, patient IDs, DOB and medical records out of public pages.
const donorSelection = { name: true, mobile: true, blood_group: true, location_city: true, location_country: true,updated_at:true,ServiceCities:{select:{city:true,country:true,created_at:true}} } as const;

export async function getPublicDonorProfile(slug: string) {
  const row = await getPrisma().publicDonorProfile.findFirst({
    where: { slug, is_published: true, admin_approved_at: { not: null }, admin_approved_by: { not: null }, User: { is_active_donor: true } },
    select: { slug: true, bio: true, phone_visible: true, article_template: true, updated_at: true, user_id: true, User: { select: donorSelection } },
  });
  if (!row || await getPrisma().restrictedIdentity.findFirst({ where: { user_id: row.user_id, is_active: true }, select: { id: true } })) return null;
  return { slug: row.slug, bio: row.bio, name: row.User.name, bloodGroup: row.User.blood_group, city: row.User.location_city, country: row.User.location_country,
    phone: row.phone_visible ? row.User.mobile : null, articleTemplate: row.article_template,serviceCities:row.User.ServiceCities.map(({city,country})=>({city,country})),updatedAt:new Date(Math.max(row.updated_at.getTime(),row.User.updated_at.getTime(),...row.User.ServiceCities.map(city=>city.created_at.getTime()))) };
}

export async function listPublicDonorProfiles(take = 60, cursor?: string) {
  const restricted = await getPrisma().restrictedIdentity.findMany({ where: { is_active: true, user_id: { not: null } }, select: { user_id: true } });
  return getPrisma().publicDonorProfile.findMany({ where: { is_published: true, admin_approved_at: { not: null }, admin_approved_by: { not: null }, user_id: { notIn: restricted.map(row => row.user_id!).filter(Boolean) }, User: { is_active_donor: true } },
    select: { id: true, slug: true, updated_at: true, User: { select: { name: true, location_city: true, location_country: true } } }, orderBy: [{ updated_at: 'desc' }, { id: 'desc' }], take: Math.min(take, 50000), ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
}

export async function getPublicProfileSettings(userId: string) {
  const row = await getPrisma().publicDonorProfile.findUnique({ where: { user_id: userId } });
  return { isPublished: !!(row?.is_published && row.admin_approved_at && row.admin_approved_by), showPhone: row?.phone_visible ?? false, bio: row?.bio ?? '', publicPath: row ? `/donors/${row.slug}` : null, consentVersion: row?.consent_version ?? null, approvedAt: row?.admin_approved_at?.toISOString() ?? null, articleTemplate: row?.admin_approved_at ? row.article_template : null };
}

export async function savePublicProfileSettings(userId: string, data: { isPublished: boolean; showPhone: boolean; bio: string; articleTemplate:number; authorizationConfirmed?: boolean }, adminId:string) {
  return getPrisma().$transaction(async tx => {
    const admin=await tx.adminUser.findUnique({where:{id:adminId},select:{role:true}});
    if(!admin||!ADMIN_ROLES.includes(admin.role as typeof ADMIN_ROLES[number]))throw new MedicalError('An active administrator must approve publication.',403);
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`public-profile:${userId}`}, 0))`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true, is_active_donor: true } });
    if (!user) throw new MedicalError('Account not found.', 404);
    const current = await tx.publicDonorProfile.findUnique({ where: { user_id: userId } });
    if (data.isPublished) {
      if (data.bio.length > 1200 || /(?:https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\d[\s().+\-]*){8,})/i.test(data.bio)) throw new MedicalError('Keep phone numbers, email addresses and web links out of your introduction. Use the separate phone publication option.');
      if (data.bio.trim().length < 80) throw new MedicalError('Write an article introduction of at least 80 characters before publishing.');
      if (!user.is_active_donor) throw new MedicalError('The donor must have active status before publishing a profile.');
      if (await tx.restrictedIdentity.findFirst({ where: { user_id: userId, is_active: true }, select: { id: true } })) throw new MedicalError('This account cannot publish a donor profile.', 403);
      if(!data.authorizationConfirmed)throw new MedicalError('Confirm that you have permission to publish the selected donor details and article.');
      if(!Number.isInteger(data.articleTemplate)||data.articleTemplate<0||data.articleTemplate>9)throw new MedicalError('Choose one of the ten article templates.');
    }
    if (!data.isPublished && !current) return;
    const now = new Date();
    const settings = { is_published: data.isPublished, phone_visible: data.isPublished && data.showPhone, bio: data.bio, article_template:data.articleTemplate,
      admin_approved_at: data.isPublished ? now : current?.admin_approved_at,
      admin_approved_by: data.isPublished ? adminId : current?.admin_approved_by,
      withdrawn_at: data.isPublished ? null : now };
    await tx.publicDonorProfile.upsert({ where: { user_id: userId }, update: settings,
      create: { user_id: userId, slug: `${toLocationSlug(user.name).slice(0,100) || 'volunteer'}-${randomUUID().slice(0,12)}`, ...settings } });
  });
}
