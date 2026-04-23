import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { listServiceCities } from '@/src/backend/services/ServiceCityService';
import { normalizeOrganList } from '@/src/lib/organCatalog';

const ProfilePatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  city: z.string().min(1).max(120).optional(),
  country: z.string().min(1).max(120).optional(),
  bloodGroup: z.string().min(1).max(10).optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  isActiveDonor: z.boolean().optional(),
  lastDonationDate: z.string().datetime().nullable().optional(),
});

const ensureUserSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden for admin session' }, { status: 403 }) };
  }

  if (session.role !== USER_ROLE) {
    return { error: NextResponse.json({ success: false, message: 'Invalid session role' }, { status: 403 }) };
  }

  return { session };
};

export async function GET(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: auth.session.user_id },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const activeOrgans = await prisma.organPledge.findMany({
    where: { user_id: user.id, is_active: true },
    select: { organ_type: true },
  });
  const serviceCities = await listServiceCities(user.id);

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      bloodGroup: user.blood_group,
      profileImageUrl: user.profile_image_url,
      city: user.location_city,
      country: user.location_country,
      isActiveDonor: user.is_active_donor,
      verificationStatus: user.verification_status,
      lastDonationDate: user.last_donation_date,
      healthData: user.health_data ?? {},
      activeOrgans: normalizeOrganList(activeOrgans.map((row) => row.organ_type)),
      serviceCities,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  const parsed = ProfilePatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid profile payload' }, { status: 400 });
  }

  const payload = parsed.data;
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({
    where: { id: auth.session.user_id },
    select: { is_active_donor: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const updateData: {
    name?: string;
    location_city?: string;
    location_country?: string;
    blood_group?: string;
    profile_image_url?: string | null;
    is_active_donor?: boolean;
    last_donation_date?: Date | null;
  } = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.city !== undefined) updateData.location_city = payload.city;
  if (payload.country !== undefined) updateData.location_country = payload.country;
  if (payload.bloodGroup !== undefined) updateData.blood_group = payload.bloodGroup;
  if (payload.profileImageUrl !== undefined) updateData.profile_image_url = payload.profileImageUrl;
  if (payload.isActiveDonor !== undefined) updateData.is_active_donor = payload.isActiveDonor;
  if (payload.lastDonationDate !== undefined) updateData.last_donation_date = payload.lastDonationDate ? new Date(payload.lastDonationDate) : null;

  const updated = await prisma.user.update({
    where: { id: auth.session.user_id },
    data: updateData,
  });

  if (payload.isActiveDonor !== undefined && payload.isActiveDonor !== existing.is_active_donor) {
    await prisma.donorStatusHistory.create({
      data: {
        user_id: updated.id,
        previous_is_active: existing.is_active_donor,
        new_is_active: payload.isActiveDonor,
        last_donation_date: payload.lastDonationDate ? new Date(payload.lastDonationDate) : null,
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      bloodGroup: updated.blood_group,
      profileImageUrl: updated.profile_image_url,
      city: updated.location_city,
      country: updated.location_country,
      isActiveDonor: updated.is_active_donor,
      lastDonationDate: updated.last_donation_date,
    },
  });
}
