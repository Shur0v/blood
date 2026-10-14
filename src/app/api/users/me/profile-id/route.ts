import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { changeProfileCode, ProfileCodeError } from '@/src/backend/services/profileIdentifiers';
import { medicalFailure, medicalUser, privateHeaders, MedicalError } from '@/src/backend/utils/medicalPrivacy';
import { nextProfileCodeChange, normalizeProfileCode, PROFILE_CODE_PATTERN } from '@/src/lib/profileIdentifier';

export async function GET(req: Request) {
  try {
    const userId = medicalUser(req);
    const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { profile_code: true, profile_code_changed_at: true } });
    if (!user) throw new MedicalError('User not found.', 404);
    const requested = new URL(req.url).searchParams.get('code');
    const code = requested === null ? null : normalizeProfileCode(requested);
    if (code !== null && !PROFILE_CODE_PATTERN.test(code)) throw new MedicalError('Use exactly four letters or numbers.');
    const reserved = code ? await getPrisma().profileIdentifier.findUnique({ where: { code }, select: { code: true } }) : null;
    return NextResponse.json({ success: true, data: {
      profileCode: user.profile_code, nextChangeAt: nextProfileCodeChange(user.profile_code_changed_at),
      ...(code && { available: code === user.profile_code || !reserved }),
    } }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}

export async function PATCH(req: Request) {
  try {
    const userId = medicalUser(req);
    const parsed = z.object({ code: z.string().max(20) }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new MedicalError('Use exactly four letters or numbers.');
    const data = await changeProfileCode(userId, parsed.data.code);
    return NextResponse.json({ success: true, data }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof ProfileCodeError) return medicalFailure(new MedicalError(error.message, error.status));
    return medicalFailure(error);
  }
}
