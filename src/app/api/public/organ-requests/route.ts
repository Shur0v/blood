import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { verifyLocationProof } from '@/src/backend/utils/locationProof';
import { validateStructuredPhone } from '@/src/backend/utils/phone';
import { normalizeOrganName } from '@/src/lib/organCatalog';

const CreateOrganRequestSchema = z.object({
  name: z.string().min(1).max(120),
  contact: z.string().min(1).max(50),
  phone: z.object({
    country_name: z.string().min(1),
    country_code: z.string().length(2),
    dial_code: z.string().regex(/^\+\d+$/),
    local_phone_number: z.string().regex(/^\d+$/),
    full_phone_number: z.string().regex(/^\+\d+$/),
  }).optional(),
  organType: z.string().min(1).max(80),
  location: z.object({
    city: z.string().min(1).max(120),
    country: z.string().min(1).max(120),
    formatted_location: z.string().min(1),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    provider_place_id: z.string().min(1),
    token: z.string().min(1),
  }),
  bloodGroup: z.string().min(1).max(10).optional(),
  medicalNote: z.string().min(1).max(5000),
  prescriptionImages: z
    .array(
      z.union([
        z.string().url(),
        z.string().regex(/^\/uploads\/.+/),
      ]),
    )
    .max(20)
    .optional(),
});

const PublicListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(16).default(16),
  cursor: z.string().optional(),
  viewerCountry: z.string().min(1).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = PublicListQuerySchema.safeParse({
      limit: url.searchParams.get('limit') || '16',
      cursor: url.searchParams.get('cursor') || undefined,
      viewerCountry: url.searchParams.get('viewerCountry') || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { limit, cursor, viewerCountry } = parsed.data;
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    const safeOffset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
    const prisma = getPrisma();
    const where = {
      status: 'VERIFIED' as const,
      ...(viewerCountry
        ? {
            location_country: {
              equals: viewerCountry.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.organRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: safeOffset,
        take: limit + 1,
      }),
      prisma.organRequest.count({ where }),
    ]);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit,
        total,
        nextCursor: hasMore ? String(safeOffset + limit) : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load approved organ requests.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = CreateOrganRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const issuePath = issue?.path?.length ? issue.path.join('.') : 'payload';
      return NextResponse.json(
        { success: false, message: `Invalid organ request payload: ${issuePath}` },
        { status: 400 },
      );
    }

    const locationProof = verifyLocationProof(parsed.data.location.token);
    if (!locationProof) {
      return NextResponse.json({ success: false, message: 'Invalid location selection. Please choose from API suggestions.' }, { status: 400 });
    }

    const locationMatches =
      locationProof.city === parsed.data.location.city &&
      locationProof.country === parsed.data.location.country &&
      locationProof.formatted_location === parsed.data.location.formatted_location &&
      locationProof.latitude === parsed.data.location.latitude &&
      locationProof.longitude === parsed.data.location.longitude &&
      locationProof.provider_place_id === parsed.data.location.provider_place_id;

    if (!locationMatches) {
      return NextResponse.json({ success: false, message: 'Location data mismatch. Manual location input is not allowed.' }, { status: 400 });
    }

    const phoneValidation = parsed.data.phone ? validateStructuredPhone(parsed.data.phone) : null;
    if (parsed.data.phone && !phoneValidation?.ok) {
      return NextResponse.json({ success: false, message: phoneValidation.error }, { status: 400 });
    }
    const normalizedOrganType = normalizeOrganName(parsed.data.organType);
    if (!normalizedOrganType) {
      return NextResponse.json({ success: false, message: 'Selected organ is not allowed for this registry.' }, { status: 400 });
    }
    const normalizedContact = phoneValidation?.ok ? phoneValidation.normalized.full_phone_number : parsed.data.contact;

    const created = await getPrisma().organRequest.create({
      data: {
        name: parsed.data.name,
        contact: normalizedContact,
        ...(phoneValidation?.ok && {
          contact_country_name: phoneValidation.normalized.country_name,
          contact_country_code: phoneValidation.normalized.country_code,
          contact_dial_code: phoneValidation.normalized.dial_code,
          contact_local_number: phoneValidation.normalized.local_phone_number,
          contact_full_number: phoneValidation.normalized.full_phone_number,
        }),
        organ_type: normalizedOrganType,
        location_city: locationProof.city,
        location_country: locationProof.country,
        location_formatted: locationProof.formatted_location,
        location_lat: locationProof.latitude,
        location_lng: locationProof.longitude,
        place_id: locationProof.provider_place_id,
        medical_note: `${parsed.data.medicalNote}\nLocation: ${locationProof.formatted_location}${parsed.data.bloodGroup ? `\nBlood Group: ${parsed.data.bloodGroup}` : ''}${parsed.data.prescriptionImages?.length ? `\nUploaded Files: ${parsed.data.prescriptionImages.length}` : ''}`,
        prescription_image: parsed.data.prescriptionImages?.[0],
        prescription_images: parsed.data.prescriptionImages?.length ? parsed.data.prescriptionImages : undefined,
        ...(parsed.data.prescriptionImages?.length
          ? {
              Attachments: {
                create: parsed.data.prescriptionImages.map((url) => ({
                  file_url: url,
                })),
              },
            }
          : {}),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to submit organ request.' }, { status: 500 });
  }
}
