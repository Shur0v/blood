import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { normalizeOrganList } from '@/src/lib/organCatalog';

const UserPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(3).max(30).optional(),
  bloodGroup: z.string().min(1).max(10).optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  city: z.string().min(1).max(120).optional(),
  country: z.string().min(1).max(120).optional(),
  isActiveDonor: z.boolean().optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED']).optional(),
  lastDonationDate: z.string().datetime().nullable().optional(),
  healthData: z.record(z.string(), z.unknown()).optional(),
  organs: z.array(z.string().min(1)).max(20).optional(),
});

const unauthorized = (req: Request): NextResponse | null => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  return null;
};

export async function GET(req: Request, context: { params: Promise<{ userId: string }> }) {
  const authError = unauthorized(req);
  if (authError) return authError;

  const { userId } = await context.params;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const activeOrgans = await prisma.organPledge.findMany({
    where: { user_id: user.id, is_active: true },
    select: { organ_type: true },
  });
  const serviceCities = await prisma.userServiceCity.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'asc' },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      bloodGroup: user.blood_group,
      dateOfBirth: user.date_of_birth,
      profileImageUrl: user.profile_image_url,
      city: user.location_city,
      country: user.location_country,
      isActiveDonor: user.is_active_donor,
      verificationStatus: user.verification_status,
      lastDonationDate: user.last_donation_date,
      healthData: user.health_data ?? {},
      activeOrgans: normalizeOrganList(activeOrgans.map((row) => row.organ_type)),
      serviceCities: serviceCities.map((city) => ({
        id: city.id,
        city: city.city,
        country: city.country,
        formatted_location: city.formatted_location,
        latitude: city.lat,
        longitude: city.lng,
        provider_place_id: city.provider_place_id,
        locked_until: city.locked_until,
        canRemove: city.locked_until.getTime() <= Date.now(),
      })),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
}

export async function PATCH(req: Request, context: { params: Promise<{ userId: string }> }) {
  const authError = unauthorized(req);
  if (authError) return authError;

  const { userId } = await context.params;
  const parsed = UserPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid user payload' }, { status: 400 });
  }

  const payload = parsed.data;
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, is_active_donor: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const updateData: {
    name?: string;
    email?: string;
    mobile?: string;
    blood_group?: string;
    date_of_birth?: Date | null;
    profile_image_url?: string | null;
    location_city?: string;
    location_country?: string;
    is_active_donor?: boolean;
    verification_status?: string;
    last_donation_date?: Date | null;
    health_data?: Prisma.InputJsonValue;
  } = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.mobile !== undefined) updateData.mobile = payload.mobile;
  if (payload.bloodGroup !== undefined) updateData.blood_group = payload.bloodGroup;
  if (payload.dateOfBirth !== undefined) updateData.date_of_birth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
  if (payload.profileImageUrl !== undefined) updateData.profile_image_url = payload.profileImageUrl;
  if (payload.city !== undefined) updateData.location_city = payload.city;
  if (payload.country !== undefined) updateData.location_country = payload.country;
  if (payload.isActiveDonor !== undefined) updateData.is_active_donor = payload.isActiveDonor;
  if (payload.verificationStatus !== undefined) updateData.verification_status = payload.verificationStatus;
  if (payload.lastDonationDate !== undefined) updateData.last_donation_date = payload.lastDonationDate ? new Date(payload.lastDonationDate) : null;
  if (payload.healthData !== undefined) updateData.health_data = payload.healthData as Prisma.InputJsonValue;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (payload.organs !== undefined) {
        const normalizedOrgans = normalizeOrganList(payload.organs);
        await tx.organPledge.deleteMany({
          where: { user_id: userId },
        });
        if (normalizedOrgans.length > 0) {
          await tx.organPledge.createMany({
            data: normalizedOrgans.map((organ) => ({
              user_id: userId,
              organ_type: organ,
              is_active: true,
            })),
          });
        }
      }

      if (payload.isActiveDonor !== undefined && payload.isActiveDonor !== existing.is_active_donor) {
        await tx.donorStatusHistory.create({
          data: {
            user_id: userId,
            previous_is_active: existing.is_active_donor,
            new_is_active: payload.isActiveDonor,
            last_donation_date: payload.lastDonationDate ? new Date(payload.lastDonationDate) : null,
          },
        });
      }

      return nextUser;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile,
        bloodGroup: updated.blood_group,
        dateOfBirth: updated.date_of_birth,
        profileImageUrl: updated.profile_image_url,
        city: updated.location_city,
        country: updated.location_country,
        isActiveDonor: updated.is_active_donor,
        verificationStatus: updated.verification_status,
        lastDonationDate: updated.last_donation_date,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ userId: string }> }) {
  const authError = unauthorized(req);
  if (authError) return authError;

  const { userId } = await context.params;
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.organRequest.updateMany({
        where: { user_id: userId },
        data: { user_id: null },
      });
      await tx.organPledge.deleteMany({ where: { user_id: userId } });
      await tx.verificationDocument.deleteMany({ where: { user_id: userId } });
      await tx.donorStatusHistory.deleteMany({ where: { user_id: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete user.' }, { status: 500 });
  }
}
