import type { Metadata } from "next";
import "./globals.css";
import DeferredClientEffects from "@/src/components/DeferredClientEffects";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getPrisma } from "@/src/backend/config/db";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiTheme = await resolveUiTheme();

  return (
    <html lang="en" data-theme={uiTheme}>
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
            ]),
          }}
        />
        <DeferredClientEffects />
        {children}
      </body>
    </html>
  );
}
