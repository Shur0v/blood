import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { verifyLocationProof } from '@/src/backend/utils/locationProof';
import { validateStructuredPhone } from '@/src/backend/utils/phone';
import { normalizeOrganList } from '@/src/lib/organCatalog';

const CreateManualOrganDonorSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal('')),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  organs: z.array(z.string().min(1).max(100)).min(1),
  otherOrgan: z.string().max(100).optional().or(z.literal('')),
  source: z.string().min(1).max(120).default('Manual Organ Entry'),
  visibilityPreference: z.enum(['PUBLIC_LISTED', 'PRIVATE_REGISTRY']).default('PUBLIC_LISTED'),
  consentReceived: z.boolean().optional(),
  medicalNote: z.string().max(2000).optional(),
  location: z.object({
    city: z.string().min(1).max(120),
    country: z.string().min(1).max(120),
    formatted_location: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    provider_place_id: z.string().min(1),
    token: z.string().min(1),
  }),
  phone: z.object({
    country_name: z.string().min(1),
    country_code: z.string().length(2),
    dial_code: z.string().regex(/^\+\d+$/),
    local_phone_number: z.string().regex(/^\d+$/),
    full_phone_number: z.string().regex(/^\+\d+$/),
  }),
});

const ensureAdminSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
};

export async function GET(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  const recent = await getPrisma().manualOrganDonor.findMany({
    orderBy: { created_at: 'desc' },
    take: 20,
  });
  return NextResponse.json({ success: true, data: recent });
}

export async function POST(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    const parsed = CreateManualOrganDonorSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid organ donor payload.' }, { status: 400 });
    }

    const payload = parsed.data;
    const locationProof = verifyLocationProof(payload.location.token);
    if (!locationProof) {
      return NextResponse.json({ success: false, message: 'Invalid location proof token.' }, { status: 400 });
    }

    const locationMatches =
      locationProof.city === payload.location.city &&
      locationProof.country === payload.location.country &&
      locationProof.formatted_location === payload.location.formatted_location &&
      locationProof.latitude === payload.location.latitude &&
      locationProof.longitude === payload.location.longitude &&
      locationProof.provider_place_id === payload.location.provider_place_id;

    if (!locationMatches) {
      return NextResponse.json({ success: false, message: 'Location mismatch. Please reselect location from suggestions.' }, { status: 400 });
    }

    const phoneValidation = validateStructuredPhone(payload.phone);
    if (!phoneValidation.ok) {
      return NextResponse.json({ success: false, message: phoneValidation.error }, { status: 400 });
    }

    const organList = normalizeOrganList([
      ...payload.organs,
      ...(payload.otherOrgan?.trim() ? [payload.otherOrgan] : []),
    ]);
    if (organList.length === 0) {
      return NextResponse.json({ success: false, message: 'Select valid organs only (Kidney, Liver, Lung, Pancreas, Intestine, Eye, Sperm).' }, { status: 400 });
    }

    const created = await getPrisma().manualOrganDonor.create({
      data: {
        name: payload.name,
        email: payload.email || null,
        mobile: phoneValidation.normalized.full_phone_number,
        phone_country_name: phoneValidation.normalized.country_name,
        phone_country_code: phoneValidation.normalized.country_code,
        phone_dial_code: phoneValidation.normalized.dial_code,
        phone_local_number: phoneValidation.normalized.local_phone_number,
        blood_group: payload.bloodGroup || null,
        organ_type: organList.join(', '),
        location_city: locationProof.city,
        location_country: locationProof.country,
        location_formatted: locationProof.formatted_location,
        location_lat: locationProof.latitude,
        location_lng: locationProof.longitude,
        place_id: locationProof.provider_place_id,
        source: `${payload.source} | ${payload.visibilityPreference} | consent:${payload.consentReceived ? 'yes' : 'no'}${payload.medicalNote ? ` | note:${payload.medicalNote}` : ''}`,
        added_by_admin: auth.session.user_id,
      },
    });

    return NextResponse.json({ success: true, data: created, message: 'Manual organ donor added successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('[manual-organ-donors][POST]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'This mobile number already exists in organ donor list.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error?.message || 'Failed to add manual organ donor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing donor id.' }, { status: 400 });
  }

  try {
    await getPrisma().manualOrganDonor.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Manual organ donor deleted.' });
  } catch (error: any) {
    console.error('[manual-organ-donors][DELETE]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Donor not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete organ donor.' }, { status: 500 });
  }
}
