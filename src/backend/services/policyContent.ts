import type { PrismaClient } from '@prisma/client';

export type SiteContentPayload = {
  termsOfService: string;
  privacySummary: string;
  privacyPolicyFull: string;
  footerContactEmail: string;
  footerContactPhone: string;
  footerContactAddress: string;
  footerAboutText: string;
  footerCopyright: string;
  joinCommunityTelegramUrl: string;
  joinCommunityTitle: string;
  joinCommunityDescription: string;
  joinCommunityMembersTitle: string;
  joinCommunityMembersDesc: string;
  joinCommunityAlertsTitle: string;
  joinCommunityAlertsDesc: string;
  joinCommunityVerifiedTitle: string;
  joinCommunityVerifiedDesc: string;
  joinCommunityTrustText: string;
  joinCommunityActiveRequestsText: string;
  impactLivesSaved: number;
  impactCountries: number;
  impactActiveDonors: number;
  impactSuccessRate: number;
  updatedAt?: string;
};

const FOOTER_TYPE = 'FOOTER_CONTACT_INFO';
const TERMS_TYPE = 'TERMS_OF_SERVICE';
const PRIVACY_SUMMARY_TYPE = 'PRIVACY_SUMMARY';
const PRIVACY_FULL_TYPE = 'PRIVACY_POLICY_FULL';

const defaultPayload: SiteContentPayload = {
  termsOfService:
    `Terms & Conditions (BloodNet)

1. Platform Purpose
BloodNet is a donor-recipient matching platform only. We connect willing donors and recipients for lawful, ethical, and medically supervised donation support.

2. Zero-Tolerance for Organ Trade
Organ selling, buying, brokering, bidding, or any financial transaction for organs is a crime and strictly prohibited. BloodNet does not support, facilitate, or permit organ trade in any form.

3. Free Donation Commitment
Users may register as donor only if they intend to donate blood or organs voluntarily and free of charge, in compliance with local law and hospital protocol.

4. Transportation Cost Rule
For blood donation support, the recipient/consumer may cover donor transportation cost only.
Important anti-scam condition: no transport payment or any payment should be made before the donor physically arrives at the agreed hospital/medical location.

5. Verification and Safety
Users must provide truthful identity, contact, and medical context. Suspicious, fake, abusive, or fraudulent activity may lead to account removal and reporting to authorities.

6. Medical Supervision
BloodNet is not a hospital and does not provide medical treatment. All donation and transfusion decisions must be handled by licensed medical professionals.

7. Consent and Responsibility
By using BloodNet, you confirm that your information is accurate, you will follow legal/medical requirements, and you understand BloodNet is only a matching service.`,
  privacySummary:
    `Privacy Summary
- We collect only required account, contact, location, and donation-preference data for lawful donor-recipient matching and safety operations.
- We use data for authentication, fraud prevention, moderation, support, analytics, and legal compliance.
- We do not sell personal data and we do not support organ trade or commercial organ transactions.
- We may share limited data with authorized medical or legal entities when required by law or safety review.
- Users may request access, correction, deletion, or restriction where applicable under local law.
- We use technical and organizational safeguards, but no internet transmission can be guaranteed 100% secure.
- By using BloodNet, users agree to this Privacy Policy and related Terms & Conditions.`,
  privacyPolicyFull:
    `Privacy Policy (Full)

Effective Date: April 22, 2026
Last Updated: April 22, 2026

BloodNet ("we", "our", "us") is a donor-recipient matching platform. This Privacy Policy explains what information we collect, how we use it, when we share it, and the rights available to users.

1. Scope
This Privacy Policy applies to information processed through BloodNet websites, dashboards, applications, and related services. It does not apply to third-party websites or services linked from our platform.

2. Important Platform Boundary
BloodNet is a matching and coordination platform only. We do not provide diagnosis, treatment, or medical advice. All medical decisions must be made by licensed professionals.
Organ selling or buying is illegal and strictly prohibited. We do not support or permit commercial organ trade.

3. Information We Collect
We may collect:
- Account identity data (name, email, verification information),
- Contact data (phone and country code),
- Profile and matching data (blood group, organ pledge preferences, donor availability),
- Location data (city/country and selected location metadata),
- Health-related inputs submitted by users (for profile context only),
- Request/report content submitted through forms,
- Uploaded files and media (verification/supporting documents),
- Operational and analytics data (session activity, clicks, error logs, device/browser context).

4. Sources of Data
We collect data:
- directly from users during registration and profile updates,
- from moderators/admin actions on dashboard workflows,
- from technical systems (security logs, diagnostics, fraud controls),
- from trusted third-party service providers used for platform operation.

5. How We Use Information
We use information to:
- create and secure user accounts,
- verify identity and reduce fraud/scams,
- match donors and recipients by eligibility/location preferences,
- process organ/blood-related requests and moderation tasks,
- provide customer and safety support,
- monitor performance and improve user experience,
- enforce legal, policy, and security requirements,
- comply with lawful requests from regulators or authorities.

6. Legal Basis (where applicable)
Depending on jurisdiction, we process data under one or more of these bases:
- user consent,
- performance of services requested by users,
- legitimate interests (platform safety, fraud prevention, service improvement),
- legal obligation and compliance requirements.

7. Data Sharing and Disclosure
We do not sell personal data.
We may share limited information with:
- authorized hospitals/medical entities where needed for legitimate donation coordination,
- service providers (hosting, storage, email, security, analytics) under contractual safeguards,
- law enforcement/regulatory entities when legally required or necessary for safety and abuse response,
- internal administrators and moderators on a need-to-know basis.

8. Cookies and Similar Technologies
We may use essential cookies and similar technologies for session security, fraud prevention, and core functionality. Non-essential analytics may be used in aggregated form to improve service quality.
Users can manage browser cookie settings; disabling some cookies may affect functionality.

9. Data Retention
We retain data only as long as needed for operational, safety, legal, and compliance purposes. Retention duration may vary by data type, dispute requirements, or legal obligations.

10. User Rights
Where applicable law grants rights, users may request:
- access to personal data,
- correction of inaccurate data,
- deletion of eligible data,
- restriction or objection to certain processing,
- export/portability where technically feasible.
Requests may be denied or limited where legal exceptions apply (for example, fraud investigation, legal hold, or regulatory compliance).

11. Children and Minors
BloodNet is not intended for unlawful use by minors. If local law requires parental/guardian consent for minors, users must comply. We may remove accounts that violate age or consent rules.

12. Security
We apply reasonable technical and organizational safeguards (access controls, role-based permissions, transport protections, and monitoring). However, no method of storage or transmission is completely secure.

13. International Processing
Depending on infrastructure setup, data may be processed in multiple jurisdictions. We use contractual and operational controls designed to protect information consistent with applicable laws.

14. Third-Party Links and Services
Our platform may reference third-party sites/tools. Their privacy practices are governed by their own policies. We are not responsible for external privacy practices.

15. Prohibited Activities and Enforcement
We may investigate and take action for abuse, fraud, impersonation, coercion, harassment, or illegal organ trade attempts. Actions may include suspension, deletion, escalation to authorities, and preservation of relevant records.

16. Policy Updates
We may revise this Privacy Policy periodically. Updated versions are published in-platform and take effect from the displayed "Last Updated" date unless local law requires otherwise.

17. Contact
For privacy questions or requests, users may contact the support details listed in the website footer Contact Info section.`,
  footerContactEmail: 'info@bloodnet.com',
  footerContactPhone: '+880 1234 567 890',
  footerContactAddress: 'Dhaka, Bangladesh',
  footerAboutText:
    'A premium blood donation platform dedicated to connecting donors and recipients with a modern, futuristic approach to healthcare.',
  footerCopyright: '© 2026 BloodNet. All rights reserved.',
  joinCommunityTelegramUrl: 'https://t.me/bloodnet',
  joinCommunityTitle: 'JOIN THE COMMUNITY',
  joinCommunityDescription:
    'Be part of our growing network of life-savers. Get instant notifications for urgent blood requirements in your area.',
  joinCommunityMembersTitle: '10K+ Members',
  joinCommunityMembersDesc: 'Join a growing network',
  joinCommunityAlertsTitle: 'Live Alerts',
  joinCommunityAlertsDesc: 'Get instant notifications',
  joinCommunityVerifiedTitle: 'Verified Only',
  joinCommunityVerifiedDesc: 'Safe & trusted donors',
  joinCommunityTrustText: 'Trusted by 10,000+ donors • Updated every minute',
  joinCommunityActiveRequestsText: '12 active requests in your area',
  impactLivesSaved: 12,
  impactCountries: 45,
  impactActiveDonors: 25,
  impactSuccessRate: 99,
};

export const resetSiteContentToDefaults = async (prisma: PrismaClient): Promise<SiteContentPayload> => {
  return saveSiteContent(prisma, defaultPayload);
};

const parseFooterContent = (raw: string | null | undefined) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SiteContentPayload>;
    return {
      footerContactEmail: parsed.footerContactEmail,
      footerContactPhone: parsed.footerContactPhone,
      footerContactAddress: parsed.footerContactAddress,
      footerAboutText: parsed.footerAboutText,
      footerCopyright: parsed.footerCopyright,
      joinCommunityTelegramUrl: parsed.joinCommunityTelegramUrl,
      joinCommunityTitle: parsed.joinCommunityTitle,
      joinCommunityDescription: parsed.joinCommunityDescription,
      joinCommunityMembersTitle: parsed.joinCommunityMembersTitle,
      joinCommunityMembersDesc: parsed.joinCommunityMembersDesc,
      joinCommunityAlertsTitle: parsed.joinCommunityAlertsTitle,
      joinCommunityAlertsDesc: parsed.joinCommunityAlertsDesc,
      joinCommunityVerifiedTitle: parsed.joinCommunityVerifiedTitle,
      joinCommunityVerifiedDesc: parsed.joinCommunityVerifiedDesc,
      joinCommunityTrustText: parsed.joinCommunityTrustText,
      joinCommunityActiveRequestsText: parsed.joinCommunityActiveRequestsText,
      impactLivesSaved: parsed.impactLivesSaved,
      impactCountries: parsed.impactCountries,
      impactActiveDonors: parsed.impactActiveDonors,
      impactSuccessRate: parsed.impactSuccessRate,
    };
  } catch {
    return null;
  }
};

export const getSiteContent = async (prisma: PrismaClient): Promise<SiteContentPayload> => {
  let rows = await prisma.policy.findMany({
    where: {
      type: {
        in: [TERMS_TYPE, PRIVACY_SUMMARY_TYPE, PRIVACY_FULL_TYPE, FOOTER_TYPE],
      },
    },
  });

  if (rows.length < 4) {
    const version = 'v-initial';
    await Promise.all([
      prisma.policy.upsert({
        where: { type: TERMS_TYPE },
        update: {},
        create: { type: TERMS_TYPE, content: defaultPayload.termsOfService, version },
      }),
      prisma.policy.upsert({
        where: { type: PRIVACY_SUMMARY_TYPE },
        update: {},
        create: { type: PRIVACY_SUMMARY_TYPE, content: defaultPayload.privacySummary, version },
      }),
      prisma.policy.upsert({
        where: { type: PRIVACY_FULL_TYPE },
        update: {},
        create: { type: PRIVACY_FULL_TYPE, content: defaultPayload.privacyPolicyFull, version },
      }),
      prisma.policy.upsert({
        where: { type: FOOTER_TYPE },
        update: {},
        create: {
          type: FOOTER_TYPE,
          content: JSON.stringify({
            footerContactEmail: defaultPayload.footerContactEmail,
            footerContactPhone: defaultPayload.footerContactPhone,
            footerContactAddress: defaultPayload.footerContactAddress,
            footerAboutText: defaultPayload.footerAboutText,
            footerCopyright: defaultPayload.footerCopyright,
            joinCommunityTelegramUrl: defaultPayload.joinCommunityTelegramUrl,
            joinCommunityTitle: defaultPayload.joinCommunityTitle,
            joinCommunityDescription: defaultPayload.joinCommunityDescription,
            joinCommunityMembersTitle: defaultPayload.joinCommunityMembersTitle,
            joinCommunityMembersDesc: defaultPayload.joinCommunityMembersDesc,
            joinCommunityAlertsTitle: defaultPayload.joinCommunityAlertsTitle,
            joinCommunityAlertsDesc: defaultPayload.joinCommunityAlertsDesc,
            joinCommunityVerifiedTitle: defaultPayload.joinCommunityVerifiedTitle,
            joinCommunityVerifiedDesc: defaultPayload.joinCommunityVerifiedDesc,
            joinCommunityTrustText: defaultPayload.joinCommunityTrustText,
            joinCommunityActiveRequestsText: defaultPayload.joinCommunityActiveRequestsText,
            impactLivesSaved: defaultPayload.impactLivesSaved,
            impactCountries: defaultPayload.impactCountries,
            impactActiveDonors: defaultPayload.impactActiveDonors,
            impactSuccessRate: defaultPayload.impactSuccessRate,
          }),
          version,
        },
      }),
    ]);

    rows = await prisma.policy.findMany({
      where: {
        type: {
          in: [TERMS_TYPE, PRIVACY_SUMMARY_TYPE, PRIVACY_FULL_TYPE, FOOTER_TYPE],
        },
      },
    });
  }

  const byType = new Map(rows.map((row) => [row.type, row]));
  const footerParsed = parseFooterContent(byType.get(FOOTER_TYPE)?.content);

  const latestDate = rows
    .map((row) => row.updated_at)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    termsOfService: byType.get(TERMS_TYPE)?.content || defaultPayload.termsOfService,
    privacySummary: byType.get(PRIVACY_SUMMARY_TYPE)?.content || defaultPayload.privacySummary,
    privacyPolicyFull: byType.get(PRIVACY_FULL_TYPE)?.content || defaultPayload.privacyPolicyFull,
    footerContactEmail: footerParsed?.footerContactEmail ?? defaultPayload.footerContactEmail,
    footerContactPhone: footerParsed?.footerContactPhone ?? defaultPayload.footerContactPhone,
    footerContactAddress: footerParsed?.footerContactAddress ?? defaultPayload.footerContactAddress,
    footerAboutText: footerParsed?.footerAboutText ?? defaultPayload.footerAboutText,
    footerCopyright: footerParsed?.footerCopyright ?? defaultPayload.footerCopyright,
    joinCommunityTelegramUrl: footerParsed?.joinCommunityTelegramUrl ?? defaultPayload.joinCommunityTelegramUrl,
    joinCommunityTitle: footerParsed?.joinCommunityTitle ?? defaultPayload.joinCommunityTitle,
    joinCommunityDescription: footerParsed?.joinCommunityDescription ?? defaultPayload.joinCommunityDescription,
    joinCommunityMembersTitle: footerParsed?.joinCommunityMembersTitle ?? defaultPayload.joinCommunityMembersTitle,
    joinCommunityMembersDesc: footerParsed?.joinCommunityMembersDesc ?? defaultPayload.joinCommunityMembersDesc,
    joinCommunityAlertsTitle: footerParsed?.joinCommunityAlertsTitle ?? defaultPayload.joinCommunityAlertsTitle,
    joinCommunityAlertsDesc: footerParsed?.joinCommunityAlertsDesc ?? defaultPayload.joinCommunityAlertsDesc,
    joinCommunityVerifiedTitle: footerParsed?.joinCommunityVerifiedTitle ?? defaultPayload.joinCommunityVerifiedTitle,
    joinCommunityVerifiedDesc: footerParsed?.joinCommunityVerifiedDesc ?? defaultPayload.joinCommunityVerifiedDesc,
    joinCommunityTrustText: footerParsed?.joinCommunityTrustText ?? defaultPayload.joinCommunityTrustText,
    joinCommunityActiveRequestsText:
      footerParsed?.joinCommunityActiveRequestsText ?? defaultPayload.joinCommunityActiveRequestsText,
    impactLivesSaved: Number(footerParsed?.impactLivesSaved ?? defaultPayload.impactLivesSaved),
    impactCountries: Number(footerParsed?.impactCountries ?? defaultPayload.impactCountries),
    impactActiveDonors: Number(footerParsed?.impactActiveDonors ?? defaultPayload.impactActiveDonors),
    impactSuccessRate: Number(footerParsed?.impactSuccessRate ?? defaultPayload.impactSuccessRate),
    updatedAt: latestDate ? latestDate.toISOString() : undefined,
  };
};

export const saveSiteContent = async (prisma: PrismaClient, payload: SiteContentPayload): Promise<SiteContentPayload> => {
  const version = `v${Date.now()}`;

  await Promise.all([
    prisma.policy.upsert({
      where: { type: TERMS_TYPE },
      update: { content: payload.termsOfService, version },
      create: { type: TERMS_TYPE, content: payload.termsOfService, version },
    }),
    prisma.policy.upsert({
      where: { type: PRIVACY_SUMMARY_TYPE },
      update: { content: payload.privacySummary, version },
      create: { type: PRIVACY_SUMMARY_TYPE, content: payload.privacySummary, version },
    }),
    prisma.policy.upsert({
      where: { type: PRIVACY_FULL_TYPE },
      update: { content: payload.privacyPolicyFull, version },
      create: { type: PRIVACY_FULL_TYPE, content: payload.privacyPolicyFull, version },
    }),
    prisma.policy.upsert({
      where: { type: FOOTER_TYPE },
      update: {
        content: JSON.stringify({
          footerContactEmail: payload.footerContactEmail,
          footerContactPhone: payload.footerContactPhone,
          footerContactAddress: payload.footerContactAddress,
          footerAboutText: payload.footerAboutText,
          footerCopyright: payload.footerCopyright,
          joinCommunityTelegramUrl: payload.joinCommunityTelegramUrl,
          joinCommunityTitle: payload.joinCommunityTitle,
          joinCommunityDescription: payload.joinCommunityDescription,
          joinCommunityMembersTitle: payload.joinCommunityMembersTitle,
          joinCommunityMembersDesc: payload.joinCommunityMembersDesc,
          joinCommunityAlertsTitle: payload.joinCommunityAlertsTitle,
          joinCommunityAlertsDesc: payload.joinCommunityAlertsDesc,
          joinCommunityVerifiedTitle: payload.joinCommunityVerifiedTitle,
          joinCommunityVerifiedDesc: payload.joinCommunityVerifiedDesc,
          joinCommunityTrustText: payload.joinCommunityTrustText,
          joinCommunityActiveRequestsText: payload.joinCommunityActiveRequestsText,
          impactLivesSaved: payload.impactLivesSaved,
          impactCountries: payload.impactCountries,
          impactActiveDonors: payload.impactActiveDonors,
          impactSuccessRate: payload.impactSuccessRate,
        }),
        version,
      },
      create: {
        type: FOOTER_TYPE,
        content: JSON.stringify({
          footerContactEmail: payload.footerContactEmail,
          footerContactPhone: payload.footerContactPhone,
          footerContactAddress: payload.footerContactAddress,
          footerAboutText: payload.footerAboutText,
          footerCopyright: payload.footerCopyright,
          joinCommunityTelegramUrl: payload.joinCommunityTelegramUrl,
          joinCommunityTitle: payload.joinCommunityTitle,
          joinCommunityDescription: payload.joinCommunityDescription,
          joinCommunityMembersTitle: payload.joinCommunityMembersTitle,
          joinCommunityMembersDesc: payload.joinCommunityMembersDesc,
          joinCommunityAlertsTitle: payload.joinCommunityAlertsTitle,
          joinCommunityAlertsDesc: payload.joinCommunityAlertsDesc,
          joinCommunityVerifiedTitle: payload.joinCommunityVerifiedTitle,
          joinCommunityVerifiedDesc: payload.joinCommunityVerifiedDesc,
          joinCommunityTrustText: payload.joinCommunityTrustText,
          joinCommunityActiveRequestsText: payload.joinCommunityActiveRequestsText,
          impactLivesSaved: payload.impactLivesSaved,
          impactCountries: payload.impactCountries,
          impactActiveDonors: payload.impactActiveDonors,
          impactSuccessRate: payload.impactSuccessRate,
        }),
        version,
      },
    }),
  ]);

  return getSiteContent(prisma);
};
