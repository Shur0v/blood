import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Send, Droplet, Users, Bell, ShieldCheck } from "lucide-react";
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:pb-16 xl:pb-20">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass relative flex-[1.8] flex flex-col items-center justify-center rounded-[8px] p-8 text-center shadow-2xl border border-white/40 overflow-hidden"
        >
          <div className="relative z-10 w-full">
            <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 uppercase">{communityData.joinCommunityTitle}</h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-gray-600 font-medium leading-relaxed">
              {communityData.joinCommunityDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title={communityData.joinCommunityMembersTitle}
                desc={communityData.joinCommunityMembersDesc}
              />
              <FeatureCard
                icon={<Bell className="h-5 w-5" />}
                title={communityData.joinCommunityAlertsTitle}
                desc={communityData.joinCommunityAlertsDesc}
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title={communityData.joinCommunityVerifiedTitle}
                desc={communityData.joinCommunityVerifiedDesc}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <motion.a
                href={communityData.joinCommunityTelegramUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#F23030] to-primary-dark px-8 py-4 text-base font-bold text-white shadow-card transition-all hover:shadow-card"
              >
                <Send className="h-5 w-5 rotate-[-20deg] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                Join Now on Telegram
              </motion.a>

              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-semibold text-gray-500">
                  <span className="opacity-60">{communityData.joinCommunityTrustText}</span>
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Image
                        key={i}
                        src={`https://i.pravatar.cc/100?u=${i + 10}`}
                        alt="User"
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full border-2 border-white object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/50 px-2 py-0.5 backdrop-blur-md">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-gray-700">
                      {communityData.joinCommunityActiveRequestsText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 overflow-hidden rounded-[8px] opacity-[0.15]">
            <div className="liquid-bg absolute inset-0 scale-150 blur-3xl" />
          </div>
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white/40 to-white/10" />
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="flex-[1] overflow-hidden rounded-[8px] shadow-2xl"
        >
          <Image
            src="https://blog.hocking.edu/hubfs/Images/Stock%20images/blood-donation_custom-4a7ebcf0e0864084e9035d1ddc48b84d884b12e8-s900-c85.jpg"
            alt="Community"
            width={900}
            height={600}
            sizes="(max-width: 768px) 100vw, 40vw"
            className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-110"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/60 bg-glass p-3 shadow-sm backdrop-blur-md transition-all hover:bg-white/60 hover:shadow-md">
      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
        {icon}
      </div>
      <h4 className="mb-0.5 text-xs font-bold text-gray-900">{title}</h4>
      <p className="text-[9px] font-medium text-gray-500">{desc}</p>
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
