import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { getSiteContent, saveSiteContent } from '@/src/backend/services/policyContent';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ContentSchema = z.object({
  termsOfService: z.string().min(1),
  privacySummary: z.string().min(1),
  privacyPolicyFull: z.string().min(1),
  footerContactEmail: z.string().email(),
  footerContactPhone: z.string().optional().default(''),
  footerContactAddress: z.string().min(2),
  footerAboutText: z.string().min(5),
  footerCopyright: z.string().min(3),
  joinCommunityTelegramUrl: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine((v) => v.length === 0 || /^https?:\/\//i.test(v), {
      message: 'Community URL must start with http:// or https://',
    }),
  joinCommunityTitle: z.string().min(2).optional().default('JOIN THE COMMUNITY'),
  joinCommunityDescription: z.string().min(5).optional().default(''),
  joinCommunityMembersTitle: z.string().min(2).optional().default('10K+ Members'),
  joinCommunityMembersDesc: z.string().min(2).optional().default('Join a growing network'),
  joinCommunityAlertsTitle: z.string().min(2).optional().default('Live Alerts'),
  joinCommunityAlertsDesc: z.string().min(2).optional().default('Get instant notifications'),
  joinCommunityVerifiedTitle: z.string().min(2).optional().default('Verified Only'),
  joinCommunityVerifiedDesc: z.string().min(2).optional().default('Safe & trusted donors'),
  joinCommunityTrustText: z.string().min(2).optional().default(''),
  joinCommunityActiveRequestsText: z.string().min(2).optional().default(''),
  impactLivesSaved: z.coerce.number().int().min(0).optional().default(12),
  impactCountries: z.coerce.number().int().min(0).optional().default(45),
  impactActiveDonors: z.coerce.number().int().min(0).optional().default(25),
  impactSuccessRate: z.coerce.number().int().min(0).max(100).optional().default(99),
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

export async function GET(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await getSiteContent(getPrisma());
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
    return NextResponse.json({ success: false, message: 'Failed to load policy content.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Invalid JSON body in policy save request.' }, { status: 400 });
    }

    const parsed = ContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid content payload.',
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = await saveSiteContent(getPrisma(), parsed.data);
    return NextResponse.json({ success: true, data, message: 'Policy and footer content updated.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown save error.';
    console.error('[PolicyContentAPI] PUT failed:', error);
    return NextResponse.json({ success: false, message: `Failed to save policy content: ${message}` }, { status: 500 });
  }
}
