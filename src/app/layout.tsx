import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./fonts.css";
import "./discovery.css";
import "./research.css";
import SeoPagePresentation from '@/src/components/SeoPagePresentation';
import DeferredClientEffects from "@/src/components/DeferredClientEffects";
import GlobalAdSenseSlot from "@/src/components/GlobalAdSenseSlot";
import GlobalHomepageContinuation from "@/src/components/GlobalHomepageContinuation";
import GlobalManagedAdsRuntime from "@/src/components/GlobalManagedAdsRuntime";
import GlobalManagedSmartLinks from "@/src/components/GlobalManagedSmartLinks";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import { DEFAULT_UI_THEME, normalizeUiTheme } from "@/src/lib/uiTheme";

import { buildDatasetSchema, buildMedicalOrganizationSchema, buildServiceSchema, stringifyJsonLd } from "@/src/lib/aiSeo";

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
      select: { ui_theme: true, discovery_visible:true },
    });
    return {theme:normalizeUiTheme(settings?.ui_theme),discoveryVisible:settings?.discovery_visible??true};
  } catch {
    return {theme:DEFAULT_UI_THEME,discoveryVisible:true};
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
  const publicStatsSchema = publicBotStats
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "@id": `${baseUrl.replace(/\/$/, "")}#public-network-stats`,
        name: "BloodNet current public network statistics",
        description:
          "Server-rendered public totals for registered active BloodNet donors, active cities, active countries, organ donor entries, and verified organ requests.",
        url: `${baseUrl.replace(/\/$/, "")}/statistics`,
        dateModified: publicBotStats.lastUpdated,
        variableMeasured: [
          { "@type": "PropertyValue", name: "Registered active donors", value: publicBotStats.registeredDonors },
          { "@type": "PropertyValue", name: "Active donor entries", value: publicBotStats.activeBloodDonors },
          { "@type": "PropertyValue", name: "Active countries", value: publicBotStats.activeCountries },
          { "@type": "PropertyValue", name: "Active cities", value: publicBotStats.activeCities },
          { "@type": "PropertyValue", name: "Organ donor entries", value: publicBotStats.organDonorEntries },
          { "@type": "PropertyValue", name: "Verified organ requests", value: publicBotStats.verifiedOrganRequests },
        ],
      }
    : null;

  return (
    <html lang="en" data-theme={uiSettings.theme} data-discovery-visible={String(uiSettings.discoveryVisible)}>

      <head><link rel="preload" href="/fonts/inter/latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyJsonLd([
              buildMedicalOrganizationSchema(),
              buildServiceSchema(),
              buildDatasetSchema(),
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${baseUrl}#website`,
                name: "BloodNet",
                url: baseUrl,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${baseUrl.replace(/\/$/, "")}/blood/{search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
              ...(publicStatsSchema ? [publicStatsSchema] : []),
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
            <p>Registered active donors: {publicBotStats.registeredDonors}</p>
            <p>Active donor entries: {publicBotStats.activeBloodDonors}</p>
            <p>Active countries: {publicBotStats.activeCountries}</p>
            <p>Active cities: {publicBotStats.activeCities}</p>
            <p>Organ donor entries: {publicBotStats.organDonorEntries}</p>
            <p>Verified organ requests: {publicBotStats.verifiedOrganRequests}</p>
            <p>{publicBotStats.publicCountingPolicy}</p>
            <p>Last updated: {publicBotStats.lastUpdated}</p>
          </section>
        )}
        <DeferredClientEffects />
        <GlobalManagedAdsRuntime />
        <SeoPagePresentation>{children}</SeoPagePresentation>
        <GlobalHomepageContinuation />
        <GlobalManagedSmartLinks />
        <GlobalAdSenseSlot />
        <Script
          id="simple-analytics"
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
