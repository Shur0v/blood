import type { Metadata } from "next";
import "./globals.css";
import ClickTracker from "@/src/components/ClickTracker";
import { getPublicBaseUrl } from "@/src/backend/config/env";

const baseUrl = getPublicBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "BloodNet | Save Lives – Global Blood & Organ Donation Network",
    template: "%s | BloodNet",
  },
  description:
    "Join BloodNet.live to connect with blood and organ donors in your region. Fast, secure, and volunteer-first donor-recipient matching.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "BloodNet | Save Lives – Global Blood & Organ Donation Network",
    description:
      "Connect with nearby blood and organ donors instantly. Built for fast emergency matching and trusted community support.",
    url: baseUrl,
    siteName: "BloodNet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClickTracker />
        {children}
      </body>
    </html>
  );
}
