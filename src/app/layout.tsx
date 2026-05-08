import type { Metadata } from "next";
import "./globals.css";
import DeferredClientEffects from "@/src/components/DeferredClientEffects";
import GlobalAdSenseSlot from "@/src/components/GlobalAdSenseSlot";
import GlobalHomepageContinuation from "@/src/components/GlobalHomepageContinuation";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import { DEFAULT_UI_THEME, normalizeUiTheme } from "@/src/lib/uiTheme";
import { Inter } from "next/font/google";
import { buildDatasetSchema, buildMedicalOrganizationSchema, buildServiceSchema, stringifyJsonLd } from "@/src/lib/aiSeo";

const baseUrl = getPublicBaseUrl();
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BloodNet | Save Lives - Global Blood & Organ Donation Network",
    template: "%s | BloodNet",
  },
  description:
    "Join BloodNet.live to connect with blood and organ donors in your region. Fast, secure, and volunteer-first donor-recipient matching.",
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
    languages: {
      "en-IN": "/india",
      "en-PK": "/pakistan",
      "en-NP": "/nepal",
      "bn-BD": "/bangladesh",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    title: "BloodNet | Save Lives - Global Blood & Organ Donation Network",
    description:
      "Connect with nearby blood and organ donors instantly. Built for fast emergency matching and trusted community support.",
    url: baseUrl,
    siteName: "BloodNet",
  },
  twitter: {
    card: "summary_large_image",
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
      select: { ui_theme: true },
    });
    return normalizeUiTheme(settings?.ui_theme);
  } catch {
    return DEFAULT_UI_THEME;
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
  const [uiTheme, publicBotStats] = await Promise.all([resolveUiTheme(), resolvePublicBotStats()]);
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
    <html lang="en" data-theme={uiTheme}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6276589710687942"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
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
        {children}
        <GlobalHomepageContinuation />
        <GlobalAdSenseSlot />
      </body>
    </html>
  );
}
