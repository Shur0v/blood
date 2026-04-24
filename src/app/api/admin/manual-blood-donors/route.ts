import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { verifyLocationProof } from '@/src/backend/utils/locationProof';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { validateStructuredPhone } from '@/src/backend/utils/phone';

const CreateManualBloodDonorSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal('')),
  bloodGroup: z.string().min(1).max(10),
  availabilityStatus: z.enum(['ACTIVE_READY', 'INACTIVE_UNAVAILABLE', 'EMERGENCY_ONLY']).default('ACTIVE_READY'),
  lastDonationDate: z.string().datetime().optional().nullable(),
  source: z.string().min(1).max(120),
  adminNotes: z.string().max(2000).optional(),
  idVerified: z.boolean().optional(),
  consentReceived: z.boolean().optional(),
  health: z
    .object({
      weightKg: z.string().optional(),
      heightCm: z.string().optional(),
      diabeticLevel: z.string().optional(),
      hemoglobin: z.string().optional(),
      allergies: z.string().optional(),
      vaccinations: z.string().optional(),
      detailedAddressNote: z.string().optional(),
    })
    .optional(),
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

const BulkManualBloodDonorRowSchema = z.object({
  name: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  bloodGroup: z.string().min(1).max(10),
  mobile: z.string().min(1).max(30),
});

const BulkCreateManualBloodDonorSchema = z.object({
  bulkDonors: z.array(BulkManualBloodDonorRowSchema).min(1).max(50),
  source: z.string().min(1).max(120).optional(),
  availabilityStatus: z.enum(['ACTIVE_READY', 'INACTIVE_UNAVAILABLE', 'EMERGENCY_ONLY']).optional(),
  country: z.string().min(1).max(120).optional(),
  adminNotes: z.string().max(2000).optional(),
  idVerified: z.boolean().optional(),
  consentReceived: z.boolean().optional(),
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

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};

const ALLOWED_BLOOD_GROUPS = new Set(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']);

const normalizeBulkPhone = (rawMobile: string) => {
  const trimmed = rawMobile.trim();
  if (!trimmed) {
    return { ok: false as const, error: 'Mobile number is required.' };
  }

  const plusSanitized = trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : trimmed.replace(/\D/g, '');

  let candidate = plusSanitized;
  if (!candidate.startsWith('+')) {
    if (candidate.startsWith('00')) {
      candidate = `+${candidate.slice(2)}`;
    } else if (candidate.startsWith('880')) {
      candidate = `+${candidate}`;
    } else if (candidate.startsWith('0')) {
      candidate = `+880${candidate.slice(1)}`;
    } else if (candidate.length === 10) {
      candidate = `+880${candidate}`;
    }
  }

  const parsed = parsePhoneNumberFromString(candidate, 'BD');
  if (!parsed || !parsed.isValid()) {
    return { ok: false as const, error: 'Invalid mobile number format.' };
  }

  const countryCode = parsed.country || 'BD';
  const dialCode = `+${parsed.countryCallingCode}`;
  return {
    ok: true as const,
    normalized: {
      country_name: countryCode === 'BD' ? 'Bangladesh' : countryCode,
      country_code: countryCode,
      dial_code: dialCode,
      local_phone_number: parsed.nationalNumber,
      full_phone_number: parsed.number,
    },
  };
};

export async function GET(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  const recent = await getPrisma().manualBloodDonor.findMany({
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
    const body = await req.json();

    if (body && typeof body === 'object' && Array.isArray((body as { bulkDonors?: unknown[] }).bulkDonors)) {
      const parsedBulk = BulkCreateManualBloodDonorSchema.safeParse(body);
      if (!parsedBulk.success) {
        return NextResponse.json({ success: false, message: 'Invalid bulk donor payload.' }, { status: 400 });
      }

      const payload = parsedBulk.data;
      const defaultCountry = payload.country?.trim() || 'Bangladesh';
      const source = payload.source || 'Bulk Manual Entry';
      const isActiveDonor = payload.availabilityStatus !== 'INACTIVE_UNAVAILABLE';
      const failures: Array<{ rowIndex: number; name: string; mobile: string; reason: string }> = [];
      const createdIds: string[] = [];

      for (let index = 0; index < payload.bulkDonors.length; index += 1) {
        const row = payload.bulkDonors[index];
        const name = row.name.trim();
        const city = row.city.trim();
        const bloodGroup = row.bloodGroup.trim().toUpperCase();

        if (!ALLOWED_BLOOD_GROUPS.has(bloodGroup)) {
          failures.push({
            rowIndex: index,
            name,
            mobile: row.mobile,
            reason: 'Invalid blood group. Use O+/O-/A+/A-/B+/B-/AB+/AB-.',
          });
          continue;
        }

        const phoneValidation = normalizeBulkPhone(row.mobile);
        if (!phoneValidation.ok) {
          failures.push({ rowIndex: index, name, mobile: row.mobile, reason: phoneValidation.error });
          continue;
        }

        const citySlug = toLocationSlug(city) || 'unknown-city';
        const countrySlug = toLocationSlug(defaultCountry) || 'unknown-country';

        try {
          const created = await getPrisma().manualBloodDonor.create({
            data: {
              name,
              email: null,
              mobile: phoneValidation.normalized.full_phone_number,
              phone_country_name: phoneValidation.normalized.country_name,
              phone_country_code: phoneValidation.normalized.country_code,
              phone_dial_code: phoneValidation.normalized.dial_code,
              phone_local_number: phoneValidation.normalized.local_phone_number,
              blood_group: bloodGroup,
              location_city: city,
              location_country: defaultCountry,
              location_formatted: `${city}, ${defaultCountry}`,
              location_lat: 0,
              location_lng: 0,
              place_id: `manual:${countrySlug}:${citySlug}:${Date.now()}:${index}`,
              is_active_donor: isActiveDonor,
              last_donation_date: null,
              source,
              added_by_admin: auth.session.user_id,
              health_data: stripUndefined({
                adminNotes: payload.adminNotes || '',
                idVerified: payload.idVerified ?? false,
                consentReceived: payload.consentReceived ?? true,
                isBulkEntry: true,
              }) as Prisma.InputJsonValue,
            },
          });

          createdIds.push(created.id);
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            failures.push({
              rowIndex: index,
              name,
              mobile: row.mobile,
              reason: 'Mobile number already exists.',
            });
            continue;
          }

          failures.push({
            rowIndex: index,
            name,
            mobile: row.mobile,
            reason: 'Failed to save this row.',
          });
        }
      }

      return NextResponse.json(
        {
          success: createdIds.length > 0,
          message:
            createdIds.length > 0
              ? `Created ${createdIds.length} donor record(s).`
              : 'No donor records were created.',
          data: {
            createdCount: createdIds.length,
            failedCount: failures.length,
            failures,
          },
        },
        { status: createdIds.length > 0 ? 201 : 400 },
      );
    }

    const parsed = CreateManualBloodDonorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid donor payload.' }, { status: 400 });
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

    const created = await getPrisma().manualBloodDonor.create({
      data: {
        name: payload.name,
        email: payload.email || null,
        mobile: phoneValidation.normalized.full_phone_number,
        phone_country_name: phoneValidation.normalized.country_name,
        phone_country_code: phoneValidation.normalized.country_code,
        phone_dial_code: phoneValidation.normalized.dial_code,
        phone_local_number: phoneValidation.normalized.local_phone_number,
        blood_group: payload.bloodGroup,
        location_city: locationProof.city,
        location_country: locationProof.country,
        location_formatted: locationProof.formatted_location,
        location_lat: locationProof.latitude,
        location_lng: locationProof.longitude,
        place_id: locationProof.provider_place_id,
        is_active_donor: payload.availabilityStatus !== 'INACTIVE_UNAVAILABLE',
        last_donation_date: payload.lastDonationDate ? new Date(payload.lastDonationDate) : null,
        source: payload.source,
        added_by_admin: auth.session.user_id,
        health_data: stripUndefined({
          ...(payload.health || {}),
          adminNotes: payload.adminNotes || '',
          idVerified: payload.idVerified ?? false,
          consentReceived: payload.consentReceived ?? false,
        }) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, data: created, message: 'Manual blood donor added successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('[manual-blood-donors][POST]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'This mobile number already exists in donors list.' }, { status: 409 });
    }
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to add manual donor.',
      },
      { status: 500 },
    );
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
    await getPrisma().manualBloodDonor.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Manual donor deleted.' });
  } catch (error: any) {
    console.error('[manual-blood-donors][DELETE]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Donor not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete donor.' }, { status: 500 });
  }
}
