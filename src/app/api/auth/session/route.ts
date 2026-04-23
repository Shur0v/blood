import { NextResponse } from 'next/server';
import { UserRepository } from '@/src/backend/repositories/UserRepository';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest } from '@/src/backend/utils/session';

const userRepo = new UserRepository();

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        role: session.role,
      },
    });
  }

  const user = await userRepo.findById(session.user_id);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const restricted = await getPrisma().restrictedIdentity.findFirst({
    where: {
      user_id: user.id,
      is_active: true,
    },
  });
  if (restricted) {
    return NextResponse.json({ authenticated: false, message: 'Account is restricted.' }, { status: 403 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: session.role,
    },
  });
}
