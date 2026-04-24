import { NextResponse } from 'next/server';
import { UserRepository } from '@/src/backend/repositories/UserRepository';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, SESSION_COOKIE } from '@/src/backend/utils/session';
import { signToken } from '@/src/backend/utils/jwt';
import { resolveSessionCookieDomain } from '@/src/backend/utils/cookieDomain';

const userRepo = new UserRepository();

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  const noStoreHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: noStoreHeaders });
  }

  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        role: session.role,
      },
    }, { headers: noStoreHeaders });
    const refreshedToken = signToken({ user_id: session.user_id, role: session.role });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: refreshedToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: resolveSessionCookieDomain(),
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  }

  const user = await userRepo.findById(session.user_id);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: noStoreHeaders });
  }

  const restricted = await getPrisma().restrictedIdentity.findFirst({
    where: {
      user_id: user.id,
      is_active: true,
    },
  });
  if (restricted) {
    return NextResponse.json({ authenticated: false, message: 'Account is restricted.' }, { status: 403, headers: noStoreHeaders });
  }

  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: session.role,
    },
  }, { headers: noStoreHeaders });

  const refreshedToken = signToken({ user_id: session.user_id, role: session.role });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: refreshedToken,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: resolveSessionCookieDomain(),
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
