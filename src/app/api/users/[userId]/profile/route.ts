import { NextResponse } from 'next/server';
import { UserRepository } from '@/src/backend/repositories/UserRepository';
import { ADMIN_ROLES, getSessionFromRequest } from '@/src/backend/utils/session';

const userRepo = new UserRepository();

export async function GET(req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await context.params;
  const isPrivileged = ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number]);
  if (!isPrivileged && session.user_id !== userId) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const user = await userRepo.findById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
  }

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
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
}
