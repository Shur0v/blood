import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { getSiteContent } from '@/src/backend/services/policyContent';
import { DEFAULT_LOCALE, resolveLocaleFromRequest } from '@/src/lib/locale';
import { translateObjectFields } from '@/src/backend/services/translationService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const prisma = getPrisma();
    const data = await getSiteContent(prisma);
    const locale = resolveLocaleFromRequest(req);

    const translated = locale !== DEFAULT_LOCALE
      ? await translateObjectFields({
          prisma,
          locale,
          contentTypePrefix: 'policy-content',
          contentVersion: data.updatedAt || null,
          obj: data,
          fields: [
            'termsOfService',
            'privacySummary',
            'privacyPolicyFull',
            'footerAboutText',
            'footerCopyright',
            'joinCommunityTitle',
            'joinCommunityDescription',
            'joinCommunityMembersTitle',
            'joinCommunityMembersDesc',
            'joinCommunityAlertsTitle',
            'joinCommunityAlertsDesc',
            'joinCommunityVerifiedTitle',
            'joinCommunityVerifiedDesc',
            'joinCommunityTrustText',
            'joinCommunityActiveRequestsText',
          ],
        })
      : data;

    return NextResponse.json(
      { success: true, data: translated, meta: { locale } },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load public content.' }, { status: 500 });
  }
}
