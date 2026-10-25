import {saveHomepageSlide} from '@/src/backend/services/homepageSlides';
import {PublicImagePlacementSchema} from '@/src/lib/publicImages';
import {validateImagePlacement,getManagedImage} from '@/src/backend/services/publicImages';
import {medicalFailure,MedicalError} from '@/src/backend/utils/medicalPrivacy';
import {securityJson} from '@/src/backend/utils/security';
import {Prisma} from '@prisma/client';
import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { listHomepageSlides } from '@/src/backend/services/homepageSlides';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SlideCreateSchema = z.object({
  public_image: PublicImagePlacementSchema.nullable().optional(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(500).optional().default(''),
  image_url: z.string().trim().url(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const ensureAdmin = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const };
};

async function handleGET(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await listHomepageSlides(getPrisma(), { includeInactive: true });
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    if(error instanceof MedicalError)return medicalFailure(error);
    return NextResponse.json({ success: false, message: 'Failed to load slides.' }, { status: 500 });
  }
}

async function handlePOST(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = SlideCreateSchema.safeParse(await securityJson(req));
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid slide payload.' }, { status: 400 });
    }

    const created=await saveHomepageSlide(parsed.data);

    return NextResponse.json({ success: true, data: created, message: 'Slide added successfully.' }, { status: 201 });
  } catch (error) {
    if(error instanceof MedicalError)return medicalFailure(error);
    return NextResponse.json({ success: false, message: 'Failed to add slide.' }, { status: 500 });
  }
}


export const GET = withActiveAdmin(handleGET);
export const POST = withActiveAdmin(handlePOST);
