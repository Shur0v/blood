import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Bell, Droplet, Heart, Send, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PublicPolicyData = {
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  footerAboutText?: string;
  footerCopyright?: string;
  joinCommunityTelegramUrl?: string;
  joinCommunityTitle?: string;
  joinCommunityDescription?: string;
  joinCommunityMembersTitle?: string;
  joinCommunityMembersDesc?: string;
  joinCommunityAlertsTitle?: string;
  joinCommunityAlertsDesc?: string;
  joinCommunityVerifiedTitle?: string;
  joinCommunityVerifiedDesc?: string;
  joinCommunityTrustText?: string;
  joinCommunityActiveRequestsText?: string;
};

type RuntimeAdUnit = {
  id: string;
  adType: "script" | "smartlink" | "native_banner" | "iframe_banner";
  scriptSrc?: string | null;
  bannerKey?: string | null;
  bannerWidth?: number | null;
  bannerHeight?: number | null;
  placement: "head" | "body_end" | "footer_inline" | "hero_center" | "donor_cards_mix" | "community_image_slot";
};

type PublicAdsPayload = {
  adsRuntimeEnabled: boolean;
  adUnits: RuntimeAdUnit[];
};

export default function SocialMedia() {
  const [communityData, setCommunityData] = useState({
    joinCommunityTelegramUrl: "https://t.me/bloodnet",
    joinCommunityTitle: "JOIN THE COMMUNITY",
    joinCommunityDescription:
      "Be part of our growing network of life-savers. Get instant notifications for urgent blood requirements in your area.",
    joinCommunityMembersTitle: "10K+ Members",
    joinCommunityMembersDesc: "Join a growing network",
    joinCommunityAlertsTitle: "Live Alerts",
    joinCommunityAlertsDesc: "Get instant notifications",
    joinCommunityVerifiedTitle: "Verified Only",
    joinCommunityVerifiedDesc: "Safe & trusted donors",
    joinCommunityTrustText: "Trusted by 10,000+ donors • Updated every minute",
    joinCommunityActiveRequestsText: "12 active requests in your area",
  });
  const [communityImageBannerAd, setCommunityImageBannerAd] = useState<{
    id: string;
    scriptSrc: string;
    bannerKey: string;
    bannerWidth: number;
    bannerHeight: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/public/policy-content', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !payload.data) return;
        const data = payload.data as PublicPolicyData;
        setCommunityData((prev) => ({
          ...prev,
          joinCommunityTelegramUrl: data.joinCommunityTelegramUrl ?? prev.joinCommunityTelegramUrl,
          joinCommunityTitle: data.joinCommunityTitle ?? prev.joinCommunityTitle,
          joinCommunityDescription: data.joinCommunityDescription ?? prev.joinCommunityDescription,
          joinCommunityMembersTitle: data.joinCommunityMembersTitle ?? prev.joinCommunityMembersTitle,
          joinCommunityMembersDesc: data.joinCommunityMembersDesc ?? prev.joinCommunityMembersDesc,
          joinCommunityAlertsTitle: data.joinCommunityAlertsTitle ?? prev.joinCommunityAlertsTitle,
          joinCommunityAlertsDesc: data.joinCommunityAlertsDesc ?? prev.joinCommunityAlertsDesc,
          joinCommunityVerifiedTitle: data.joinCommunityVerifiedTitle ?? prev.joinCommunityVerifiedTitle,
          joinCommunityVerifiedDesc: data.joinCommunityVerifiedDesc ?? prev.joinCommunityVerifiedDesc,
          joinCommunityTrustText: data.joinCommunityTrustText ?? prev.joinCommunityTrustText,
          joinCommunityActiveRequestsText: data.joinCommunityActiveRequestsText ?? prev.joinCommunityActiveRequestsText,
        }));
      } catch {
        // keep defaults
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    const loadAds = async () => {
      try {
        const res = await fetch("/api/public/ads-settings", { method: "GET", cache: "no-store" });
        const payload = await res.json();
        if (!active || !res.ok || !payload?.success) return;
        const data = payload.data as PublicAdsPayload;
        if (!data.adsRuntimeEnabled) {
          setCommunityImageBannerAd(null);
          return;
        }
        const match = data.adUnits.find(
          (item) =>
            item.adType === "iframe_banner" &&
            item.placement === "community_image_slot" &&
            item.scriptSrc &&
            item.bannerKey &&
            Number(item.bannerWidth) > 0 &&
            Number(item.bannerHeight) > 0
        );
        if (!match) {
          setCommunityImageBannerAd(null);
          return;
        }
        setCommunityImageBannerAd({
          id: String(match.id),
          scriptSrc: String(match.scriptSrc),
          bannerKey: String(match.bannerKey),
          bannerWidth: Number(match.bannerWidth),
          bannerHeight: Number(match.bannerHeight),
        });
      } catch {
        // fallback to image
      }
    };
    void loadAds();
    const t = window.setInterval(() => void loadAds(), 20000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:pb-16 xl:pb-20">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="overflow-hidden rounded-[8px] border border-gray-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8 lg:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="flex flex-col items-start">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-primary">
              <Users className="h-4 w-4" />
              {communityData.joinCommunityTitle}
            </div>

            <div className="mb-5 flex items-start gap-4">
              <h2 className="max-w-xl text-5xl font-black leading-[0.95] tracking-normal text-gray-950 sm:text-6xl lg:text-7xl">
                Be a Hero.
                <span className="block text-primary">Save a Life.</span>
              </h2>
              <Heart className="mt-3 hidden h-8 w-8 text-primary sm:block" />
            </div>

            <p className="mb-7 max-w-xl text-base font-medium leading-relaxed text-gray-600">
              {communityData.joinCommunityDescription}
            </p>

            <div className="mb-8 grid w-full gap-4 sm:grid-cols-3">
              <CommunityFeature
                icon={<Users className="h-5 w-5" />}
                title={communityData.joinCommunityMembersTitle}
                desc={communityData.joinCommunityMembersDesc}
              />
              <CommunityFeature
                icon={<Bell className="h-5 w-5" />}
                title={communityData.joinCommunityAlertsTitle}
                desc={communityData.joinCommunityAlertsDesc}
              />
              <CommunityFeature
                icon={<ShieldCheck className="h-5 w-5" />}
                title={communityData.joinCommunityVerifiedTitle}
                desc={communityData.joinCommunityVerifiedDesc}
              />
            </div>

            <motion.a
              href={communityData.joinCommunityTelegramUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="group mb-5 inline-flex items-center justify-center gap-3 rounded-[8px] bg-gradient-to-r from-[#ff3131] to-primary-dark px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_35px_rgba(239,0,0,0.28)] transition-all hover:shadow-[0_18px_40px_rgba(239,0,0,0.34)] sm:text-base"
            >
              <Send className="h-5 w-5 rotate-[-20deg] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              Join Now on Telegram
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.a>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <Image
                    key={i}
                    src={`https://i.pravatar.cc/100?u=${i + 10}`}
                    alt="Community member"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm"
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-500">
                  {communityData.joinCommunityTrustText}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-gray-800">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  {communityData.joinCommunityActiveRequestsText}
                </span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ x: 40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative min-h-[320px] overflow-hidden rounded-[8px] shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:min-h-[420px] lg:min-h-[460px]"
          >
            {communityImageBannerAd ? (
              <CommunityImageBannerAdSlot ad={communityImageBannerAd} />
            ) : (
              <Image
                src="https://blog.hocking.edu/hubfs/Images/Stock%20images/blood-donation_custom-4a7ebcf0e0864084e9035d1ddc48b84d884b12e8-s900-c85.jpg"
                alt="Blood donor giving blood"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function CommunityImageBannerAdSlot({
  ad,
}: {
  ad: { id: string; scriptSrc: string; bannerKey: string; bannerWidth: number; bannerHeight: number };
}) {
  const [containerId] = useState(`community-image-slot-${ad.id}`);

  useEffect(() => {
    const host = document.getElementById(containerId);
    if (!host) return;
    host.innerHTML = "";
    (window as Window & { atOptions?: unknown }).atOptions = {
      key: ad.bannerKey,
      format: "iframe",
      height: ad.bannerHeight,
      width: ad.bannerWidth,
      params: {},
    };
    const script = document.createElement("script");
    script.src = ad.scriptSrc;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-bloodnet-community-image-ad", ad.id);
    host.appendChild(script);
    return () => {
      host.innerHTML = "";
    };
  }, [ad.bannerHeight, ad.bannerKey, ad.bannerWidth, ad.id, ad.scriptSrc, containerId]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-white/60 p-4">
      <div id={containerId} style={{ width: `${ad.bannerWidth}px`, minHeight: `${ad.bannerHeight}px` }} className="max-w-full overflow-hidden" />
    </div>
  );
}

function CommunityFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-gray-200 sm:border-r sm:pr-4 sm:last:border-r-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-black text-gray-950">{title}</h4>
        <p className="mt-1 text-xs font-medium leading-snug text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

interface FooterProps {
  onOpenPolicy?: (type: 'terms' | 'privacy') => void;
  onPageChange?: (page: string) => void;
}

export function Footer({ onOpenPolicy, onPageChange }: FooterProps) {
  const [footerData, setFooterData] = useState({
    footerContactEmail: "info@bloodnet.com",
    footerContactPhone: "+880 1234 567 890",
    footerContactAddress: "Dhaka, Bangladesh",
    footerAboutText:
      "A premium blood donation platform dedicated to connecting donors and recipients with a modern, futuristic approach to healthcare.",
    footerCopyright: "© 2026 BloodNet. All rights reserved.",
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/public/policy-content', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) return;
        const data = payload.data as PublicPolicyData;
        setFooterData((prev) => ({
          ...prev,
          footerContactEmail: data.footerContactEmail ?? prev.footerContactEmail,
          footerContactPhone: data.footerContactPhone ?? prev.footerContactPhone,
          footerContactAddress: data.footerContactAddress ?? prev.footerContactAddress,
          footerAboutText: data.footerAboutText ?? prev.footerAboutText,
          footerCopyright: data.footerCopyright ?? prev.footerCopyright,
        }));
      } catch {
        // fallback remains
      }
    };
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      controller.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <footer className="bg-black py-24 text-gray-400">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-dark">
                <Droplet className="h-7 w-7 text-white fill-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-white">BloodNet</span>
            </div>
            <p className="max-w-md text-lg leading-relaxed">
              {footerData.footerAboutText}
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-xl font-bold text-white">Quick Links</h4>
            <ul className="flex flex-col gap-4 text-lg">
              <li><Link href="/faq" className="transition-colors hover:text-white text-left">FAQ</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-white text-left">Privacy Policy (Full)</Link></li>
              <li><button onClick={() => onOpenPolicy?.('privacy')} className="transition-colors hover:text-white text-left">Privacy Summary</button></li>
              <li><Link href="/terms" className="transition-colors hover:text-white text-left">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xl font-bold text-white">Contact Info</h4>
            <ul className="flex flex-col gap-4 text-lg">
              <li>{footerData.footerContactEmail}</li>
              <li>{footerData.footerContactAddress}</li>
              {footerData.footerContactPhone.trim() && <li>{footerData.footerContactPhone}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-24 border-t border-white/10 pt-12 text-center text-sm">
          <p>{footerData.footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
}
