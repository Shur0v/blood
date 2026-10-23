import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPrisma } from '@/src/backend/config/db';
import { signToken } from '@/src/backend/utils/jwt';
import { resolveSessionCookieDomain } from '@/src/backend/utils/cookieDomain';
import { securityJson, securityRateLimit, securityFailure } from '@/src/backend/utils/security';
import { getIpHash } from '@/src/backend/utils/risk';
import { createHash, timingSafeEqual } from 'node:crypto';
import {staffCredentialVersion} from '../utils/staffCredential';

const LoginSchema = z.object({
  adminId: z.string().min(2).max(120),
  password: z.string().min(6).max(1024),
});

const looksHashed = (value: string): boolean => value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');

export function staffLogin(expectedRole:'ADMIN'|'MANAGER') { return async function POST(req: Request) {
  try {
    const body = await securityJson(req,8192);
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid login payload.' }, { status: 400 });
    }

    const { adminId, password } = parsed.data;
    await securityRateLimit('admin-login-ip',getIpHash(req),50,15*60*1000);
    await securityRateLimit('admin-login-id',adminId.toLowerCase(),8,15*60*1000);
    const prisma = getPrisma();
    const adminUser = await prisma.adminUser.findUnique({
      where: { admin_id: adminId },
    });

    if (!adminUser || adminUser.role !== expectedRole) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatch = looksHashed(adminUser.password)
      ? await bcrypt.compare(password, adminUser.password)
      : timingSafeEqual(createHash('sha256').update(adminUser.password).digest(),createHash('sha256').update(password).digest());

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const storedHash=looksHashed(adminUser.password)?adminUser.password:await bcrypt.hash(password,12);
    const updated = await prisma.adminUser.updateMany({
      where: { id: adminUser.id, password:adminUser.password, role:expectedRole },
      data: { last_login: new Date(), ...(!looksHashed(adminUser.password)?{password:storedHash}:{}) },
    });
    if(updated.count!==1)return NextResponse.json({success:false,message:'Invalid credentials.'},{status:401});

    const token = signToken({ user_id: adminUser.id, role: adminUser.role, credential_version:staffCredentialVersion(adminUser.id,storedHash) });
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
      domain: resolveSessionCookieDomain(),
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    return securityFailure(error);
  }
}

}
