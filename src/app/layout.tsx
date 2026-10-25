import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./fonts.css";
import "./discovery.css";
import "./research.css";
import SeoPagePresentation from '@/src/components/SeoPagePresentation';
import SiteNavShell from '@/src/components/SiteNavShell';
import { SiteNavigationProvider } from '@/src/components/SiteNavigationProvider';
import DeferredClientEffects from "@/src/components/DeferredClientEffects";
import GlobalAdSenseSlot from "@/src/components/GlobalAdSenseSlot";
import GlobalManagedAdsRuntime from "@/src/components/GlobalManagedAdsRuntime";
import GlobalManagedSmartLinks from "@/src/components/GlobalManagedSmartLinks";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import { DEFAULT_UI_THEME, normalizeUiTheme } from "@/src/lib/uiTheme";

import { buildMedicalOrganizationSchema, buildServiceSchema, stringifyJsonLd } from "@/src/lib/aiSeo";

const baseUrl = getPublicBaseUrl();


export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BloodNet | Save Lives - Global Blood & Organ Donation Network",
    template: "%s | BloodNet",
  },
  description:
    "Find active blood donors by blood group, city and country. Explore organ donor pledges and connect with volunteers through BloodNet's free donor directory.",
  applicationName: 'BloodNet',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined, ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}) },
  keywords: [
    "blood donation",
    "urgent blood donation",
    "emergency blood donation",
    "blood donor near me",
    "organ donor registry",
    "emergency donor finder",
  ],
  icons: {
    icon: "/favicon.png",
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "BloodNet | Save Lives - Global Blood & Organ Donation Network",
    description:
      "Connect with nearby blood and organ donors instantly. Built for fast emergency matching and trusted community support.",
    url: baseUrl,
    siteName: "BloodNet",
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'BloodNet blood and organ donor directory' }],
  },
  twitter: {
    card: "summary_large_image",
    images: ['/opengraph-image'],
    title: "BloodNet | Global Blood & Organ Donation Network",
    description:
      "Search active blood donors by blood group and city, and browse verified organ donation request pages.",
  },
};

async function resolveUiTheme() {
  try {
    const prisma = getPrisma();
    const settings = await prisma.platformSettings.findFirst({
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
      select: { ui_theme: true, discovery_visible:true,patient_id_visible:true,city_donation_request_visible:true },
    });
    return {theme:normalizeUiTheme(settings?.ui_theme),discoveryVisible:settings?.discovery_visible??true,patientIdVisible:settings?.patient_id_visible??false,cityDonationRequestVisible:settings?.city_donation_request_visible??false};
  } catch {
    return {theme:DEFAULT_UI_THEME,discoveryVisible:true,patientIdVisible:false,cityDonationRequestVisible:false};
  }
}

async function resolvePublicBotStats() {
  try {
    return await getPublicBotStats();
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [uiSettings, publicBotStats] = await Promise.all([resolveUiTheme(), resolvePublicBotStats()]);
  return (
    <html lang="en" data-city-donation-request-visible={String(uiSettings.cityDonationRequestVisible)} data-theme={uiSettings.theme} data-discovery-visible={String(uiSettings.discoveryVisible)} data-patient-id-visible={String(uiSettings.patientIdVisible)}>

      <head><link rel="preload" href="/fonts/inter/latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyJsonLd([
              buildMedicalOrganizationSchema(),
              buildServiceSchema(),

              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${baseUrl}#website`,
                name: "BloodNet",
                url: baseUrl,
              },

            ]),
          }}
        />
        {publicBotStats && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__BLOODNET_PUBLIC_STATS__=${JSON.stringify(publicBotStats).replace(/</g, "\\u003c")};`,
            }}
          />
        )}
        {publicBotStats && (
          <section
            id="bloodnet-public-stats"
            aria-label="Current public BloodNet network statistics"
            className="sr-only"
            data-active-blood-donors={publicBotStats.activeBloodDonors}
            data-registered-users={publicBotStats.registeredDonors}
            data-active-countries={publicBotStats.activeCountries}
            data-active-cities={publicBotStats.activeCities}
            data-organ-donor-entries={publicBotStats.organDonorEntries}
            data-verified-organ-requests={publicBotStats.verifiedOrganRequests}
            data-last-updated={publicBotStats.lastUpdated}
          >
            <h2>Current public BloodNet network statistics</h2>
            <p>Total registered accounts worldwide: {publicBotStats.totalRegisteredAccounts}</p>
            <p>Active registered donor accounts: {publicBotStats.registeredAccounts}</p>
            <p>Manual donor entries: {publicBotStats.manualDonorEntries}</p>
            <p>Community organisation listings: {publicBotStats.communityListings}</p>
            <p>Active donor entries: {publicBotStats.activeBloodDonors}</p>
            <p>Active countries: {publicBotStats.activeCountries}</p>
            <p>Active cities: {publicBotStats.activeCities}</p>
            <p>Organ donor entries: {publicBotStats.organDonorEntries}</p>
            <p>Verified organ requests: {publicBotStats.verifiedOrganRequests}</p>
            <p>{publicBotStats.publicCountingPolicy}</p>
            <p>Last updated: {publicBotStats.lastUpdated}</p>
          </section>
        )}
        <SiteNavigationProvider>
          <DeferredClientEffects />
          <GlobalManagedAdsRuntime />
          <SeoPagePresentation>{children}</SeoPagePresentation>
          <GlobalManagedSmartLinks />
          <GlobalAdSenseSlot />
          <SiteNavShell />
        </SiteNavigationProvider>
        <Script
          id="simple-analytics"
          data-ignore-pages="/private,/private/*,/admin,/admin/*,/admin-dashboard,/admin-dashboard/*,/dashboard,/dashboard/*"
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
