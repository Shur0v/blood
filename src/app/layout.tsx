import type { Metadata } from "next";
import "./globals.css";
import ClickTracker from "@/src/components/ClickTracker";
import ThemeRuntimeSync from "@/src/components/ThemeRuntimeSync";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getPrisma } from "@/src/backend/config/db";
import { DEFAULT_UI_THEME, normalizeUiTheme } from "@/src/lib/uiTheme";

const baseUrl = getPublicBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BloodNet | Save Lives - Global Blood & Organ Donation Network",
    template: "%s | BloodNet",
  },
  description:
    "Join BloodNet.live to connect with blood and organ donors in your region. Fast, secure, and volunteer-first donor-recipient matching.",
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
      <body className="antialiased">
        <ThemeRuntimeSync />
        <ClickTracker />
        {children}
      </body>
    </html>
  );
}
