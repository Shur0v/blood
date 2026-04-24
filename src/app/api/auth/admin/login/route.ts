import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPrisma } from '@/src/backend/config/db';
import { signToken } from '@/src/backend/utils/jwt';

const LoginSchema = z.object({
  adminId: z.string().min(2),
  password: z.string().min(6),
});

const looksHashed = (value: string): boolean => value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid login payload.' }, { status: 400 });
    }

    const { adminId, password } = parsed.data;
    const prisma = getPrisma();
    const adminUser = await prisma.adminUser.findUnique({
      where: { admin_id: adminId },
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatch = looksHashed(adminUser.password)
      ? await bcrypt.compare(password, adminUser.password)
      : adminUser.password === password;

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { last_login: new Date() },
    });

    const token = signToken({ user_id: adminUser.id, role: adminUser.role });
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        adminId: adminUser.admin_id,
        role: adminUser.role,
      },
    });

    response.cookies.set({
      name: 'bloodnet_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: resolveCookieDomain(),
      maxAge: 365 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Login failed.' }, { status: 500 });
  }
}
