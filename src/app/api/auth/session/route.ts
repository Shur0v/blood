import { NextResponse } from 'next/server';
import { UserRepository } from '@/src/backend/repositories/UserRepository';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, SESSION_COOKIE } from '@/src/backend/utils/session';
import { signToken } from '@/src/backend/utils/jwt';

const userRepo = new UserRepository();

const resolveCookieDomain = (): string | undefined => {
  if (process.env.NODE_ENV !== 'production') return undefined;
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl) return undefined;
  try {
    const hostname = new URL(configuredUrl).hostname;
    if (!hostname || hostname === 'localhost') return undefined;
    return hostname.startsWith('.') ? hostname : `.${hostname}`;
  } catch {
    return undefined;
  }
};

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
      domain: resolveCookieDomain(),
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
    domain: resolveCookieDomain(),
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
