import { z } from 'zod';
import { NextResponse } from 'next/server';
import { medicalUser, medicalFailure, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { securityJson, securityRateLimit } from '@/src/backend/utils/security';
import { getPublicProfileSettings, savePublicProfileSettings } from '@/src/backend/services/publicDonorProfiles';

const Settings = z.object({ isPublished: z.boolean(), showPhone: z.boolean(), bio: z.string().trim().max(1200), consent: z.boolean().optional(), phoneConsent: z.boolean().optional() }).strict();
export async function GET(req: Request) {
  try { return NextResponse.json({ success: true, data: await getPublicProfileSettings(medicalUser(req)) }, { headers: privateHeaders }); }
  catch(error) { return medicalFailure(error); }
}
export async function PATCH(req: Request) {
  try {
    const userId = medicalUser(req);
    await securityRateLimit('public-profile-update', userId, 20, 60*60*1000);
    const parsed = Settings.safeParse(await securityJson(req, 8192));
    if (!parsed.success) return NextResponse.json({ success: false, message: 'Check the profile fields. Your introduction must be at most 1,200 characters.' }, { status: 400, headers: privateHeaders });
    await savePublicProfileSettings(userId, parsed.data);
    return NextResponse.json({ success: true, data: await getPublicProfileSettings(userId) }, { headers: privateHeaders });
  } catch(error) { return medicalFailure(error); }
}
