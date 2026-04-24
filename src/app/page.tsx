"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import OrganHero from "../components/OrganHero";
import ImageSlider from "../components/ImageSlider";
import FloatingDonorTags from "../components/FloatingDonorTags";
import CTA from "../components/CTA";
import SocialMedia, { Footer } from "../components/SocialMedia";
import FluidBackground from "../components/FluidBackground";
import ProcessSteps from "../components/ProcessSteps";
import ImpactData from "../components/ImpactData";
import Testimonials from "../components/Testimonials";
import UserReports from "../components/UserReports";
import RequestOrgan from "../components/RequestOrgan";
import ApprovedOrganRequests from "../components/ApprovedOrganRequests";
import MobilePreview from "../components/MobilePreview";
import { PolicyModal } from "../components/PolicyModal";
import { FullPrivacyPage } from "../components/FullPrivacyPage";
import { FullTermsPage } from "../components/FullTermsPage";
import AuthModal from "../components/AuthModal";
import UnifiedDashboard from "../components/UnifiedDashboard";
import DonationToggleModal from "../components/DonationToggleModal";
import MedicalAidFund from "../components/MedicalAidFund";
import { motion, useScroll, useSpring } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  bloodGroup: string;
  profileImageUrl?: string | null;
  city: string;
  country: string;
  isActiveDonor: boolean;
  verificationStatus: string;
  lastDonationDate: string | null;
  healthData?: Record<string, unknown>;
  activeOrgans?: string[];
  serviceCities?: Array<{
    id: string;
    city: string;
    country: string;
    formatted_location: string;
    latitude: number;
    longitude: number;
    provider_place_id: string;
    locked_until: string;
    canRemove: boolean;
    remainingDays: number;
    created_at: string;
  }>;
}

const USER_SESSION_CACHE_KEY = "bloodnet:user-session:v1";
const USER_PROFILE_CACHE_KEY = "bloodnet:user-profile:v1";

const readCachedJson = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export default function Home() {
  const profileIntentHandledRef = useRef(false);
  const sessionUserRef = useRef<SessionUser | null>(null);
  const lastSilentSessionCheckRef = useRef(0);
  const [currentPage, setCurrentPage] = useState("home");
  const [isProfileView, setIsProfileView] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => readCachedJson<SessionUser>(USER_SESSION_CACHE_KEY));
  const [isSessionLoading, setIsSessionLoading] = useState(() => !Boolean(readCachedJson<SessionUser>(USER_SESSION_CACHE_KEY)));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isReadyToDonate, setIsReadyToDonate] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(() => readCachedJson<ProfileData>(USER_PROFILE_CACHE_KEY));
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    document.body.dataset.analyticsPage = isProfileView ? "profile" : currentPage;
    return () => {
      delete document.body.dataset.analyticsPage;
    };
  }, [currentPage, isProfileView]);

  useEffect(() => {
    sessionUserRef.current = sessionUser;
  }, [sessionUser]);

  const clearClientSession = useCallback(() => {
    setSessionUser(null);
    setProfileData(null);
    setIsProfileView(false);
    setProfileLoadError("");
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(USER_SESSION_CACHE_KEY);
        window.localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      } catch {
        // ignore storage failures
      }
    }
  }, []);

  const loadSession = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      const now = Date.now();
      if (now - lastSilentSessionCheckRef.current < 10000) {
        return;
      }
      lastSilentSessionCheckRef.current = now;
    }

    if (!silent) {
      setIsSessionLoading(true);
    }
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearClientSession();
        }
        return;
      }

      const data = await res.json();
      const nextUser = (data.user || null) as SessionUser | null;
      setSessionUser((prev) => {
        if (!prev && !nextUser) return prev;
        if (prev && nextUser && prev.id === nextUser.id && prev.role === nextUser.role && prev.email === nextUser.email && prev.name === nextUser.name) {
          return prev;
        }
        return nextUser;
      });
    } catch (error) {
      // keep previous session on transient network/server failures
    } finally {
      if (!silent) {
        setIsSessionLoading(false);
      }
    }
  }, [clearClientSession]);

  const loadProfile = useCallback(async () => {
    const currentSession = sessionUserRef.current;
    if (!currentSession) return;
    setIsProfileLoading(true);
    setProfileLoadError("");
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearClientSession();
          return;
        }
        const cachedProfile = readCachedJson<ProfileData>(USER_PROFILE_CACHE_KEY);
        if (cachedProfile) {
          setProfileData(cachedProfile);
          setIsReadyToDonate(Boolean(cachedProfile.isActiveDonor));
          setProfileLoadError("");
        } else {
          setProfileLoadError("Unable to load profile right now.");
        }
        return;
      }

      const payload = await res.json();
      if (!payload.success) {
        const cachedProfile = readCachedJson<ProfileData>(USER_PROFILE_CACHE_KEY);
        if (cachedProfile) {
          setProfileData(cachedProfile);
          setIsReadyToDonate(Boolean(cachedProfile.isActiveDonor));
          setProfileLoadError("");
        } else {
          setProfileLoadError("Unable to load profile right now.");
        }
        return;
      }

      setProfileData(payload.data);
      setIsReadyToDonate(Boolean(payload.data.isActiveDonor));
    } catch (error) {
      const cachedProfile = readCachedJson<ProfileData>(USER_PROFILE_CACHE_KEY);
      if (cachedProfile) {
        setProfileData(cachedProfile);
        setIsReadyToDonate(Boolean(cachedProfile.isActiveDonor));
        setProfileLoadError("");
      } else {
        setProfileLoadError("Unable to load profile right now.");
      }
    } finally {
      setIsProfileLoading(false);
    }
  }, [clearClientSession]);

  useEffect(() => {
    void loadSession({ silent: false });
  }, [loadSession]);

  useEffect(() => {
    if (!sessionUser || !isProfileView) return;
    void loadProfile();
  }, [isProfileView, sessionUser?.id, loadProfile]);

  useEffect(() => {
    if (!sessionUser) {
      setProfileData(null);
      setProfileLoadError("");
    }
  }, [sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionUser) {
        window.localStorage.setItem(USER_SESSION_CACHE_KEY, JSON.stringify(sessionUser));
      } else {
        window.localStorage.removeItem(USER_SESSION_CACHE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (profileData) {
        window.localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profileData));
      } else {
        window.localStorage.removeItem(USER_PROFILE_CACHE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, [profileData]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void loadSession({ silent: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadSession({ silent: true });
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wantsProfile = new URLSearchParams(window.location.search).get("profile") === "1";
    if (!wantsProfile || profileIntentHandledRef.current) return;

    profileIntentHandledRef.current = true;
    if (sessionUser) {
      setIsProfileView(true);
      return;
    }
    setIsAuthModalOpen(true);
  }, [sessionUser]);

  const updateProfileStatus = async (isActiveDonor: boolean, lastDonationDate?: string | null) => {
    const res = await fetch("/api/users/me/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isActiveDonor,
        ...(lastDonationDate ? { lastDonationDate: new Date(lastDonationDate).toISOString() } : {}),
      }),
    });

    if (!res.ok) return;
    const payload = await res.json();
    if (!payload.success) return;

    setProfileData((prev) => (prev ? { ...prev, ...payload.data } : prev));
  };

  const handleAuthClick = () => {
    if (sessionUser) {
      setIsProfileView(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleHomeClick = () => {
    setIsProfileView(false);
    setCurrentPage("home");
  };

  const handlePageChange = (page: string) => {
    setIsProfileView(false);
    setCurrentPage(page);
  };

  const handleToggleReady = (ready: boolean) => {
    if (ready) {
      setIsDonationModalOpen(true);
    } else {
      setIsReadyToDonate(false);
      void updateProfileStatus(false, null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] h-1.5 origin-left bg-primary-dark shadow-lg shadow-primary-dark/50"
        style={{ scaleX }}
      />

      <Navbar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onHomeClick={handleHomeClick}
        onAuthClick={handleAuthClick}
        isLoggedIn={Boolean(sessionUser)}
      />

      <main>
        {isProfileView && sessionUser && (
          <div className="mx-auto max-w-7xl px-4 py-24">
            {(isSessionLoading || isProfileLoading) && !profileData ? (
              <div className="rounded-3xl border border-border/20 bg-glass p-8 text-center text-sm font-semibold text-text/70">
                Loading your profile...
              </div>
            ) : profileLoadError && !profileData ? (
              <div className="rounded-3xl border border-red-300/40 bg-red-50/40 p-8 text-center">
                <p className="text-sm font-semibold text-red-700">{profileLoadError}</p>
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  className="mt-4 rounded-xl bg-primary-dark px-6 py-2 text-xs font-bold uppercase tracking-widest text-white"
                >
                  Retry
                </button>
              </div>
            ) : !profileData ? (
              <div className="rounded-3xl border border-border/20 bg-glass p-8 text-center text-sm font-semibold text-text/70">
                Refreshing profile data...
              </div>
            ) : (
              <UnifiedDashboard
                isReady={isReadyToDonate}
                onToggleReady={handleToggleReady}
                onSessionExpired={clearClientSession}
                onHealthDataSaved={(healthData) => {
                  setProfileData((prev) => (prev ? { ...prev, healthData } : prev));
                }}
                onOrgansSaved={(activeOrgans) => {
                  setProfileData((prev) => (prev ? { ...prev, activeOrgans } : prev));
                }}
                profile={profileData}
              />
            )}
          </div>
        )}

        {!isProfileView && currentPage === "home" && (
          <>
            <Hero />

            <ProcessSteps />
            <ImageSlider />
            <MedicalAidFund />
            <FloatingDonorTags />
            <ImpactData />
            <RequestOrgan />
            <Testimonials />
            <UserReports />
            <MobilePreview />
            <CTA onSignUpClick={() => setIsAuthModalOpen(true)} showSignUpButton={!sessionUser} />
            <SocialMedia />
          </>
        )}

        {!isProfileView && currentPage === "organ" && (
          <>
            <OrganHero />
            <ApprovedOrganRequests />

            <ProcessSteps />
            <ImageSlider />
            <MedicalAidFund />
            <FloatingDonorTags />
            <ImpactData />
            <RequestOrgan />
            <Testimonials />
            <UserReports />
            <MobilePreview />
            <SocialMedia />
          </>
        )}

        {!isProfileView && currentPage === "blog" && (
          <div className="mx-auto max-w-4xl px-4 py-32 text-center">
            <h2 className="text-3xl font-black text-gray-900">Blog moved to dedicated SEO route</h2>
            <p className="mt-3 text-gray-600">
              Visit the text-only long-form journal at{" "}
              <a href="/blog" className="font-bold text-primary-dark">
                /blog
              </a>
              .
            </p>
          </div>
        )}

        {!isProfileView && currentPage === "privacy-policy" && <FullPrivacyPage />}
        {!isProfileView && currentPage === "terms-conditions" && <FullTermsPage />}
      </main>

      {!isProfileView && (
        <Footer
          onOpenPolicy={(type) => setPolicyModal({ isOpen: true, type })}
          onPageChange={handlePageChange}
        />
      )}

      <PolicyModal
        isOpen={policyModal.isOpen}
        type={policyModal.type}
        onClose={() => setPolicyModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setSessionUser(user);
          setIsProfileView(true);
        }}
      />

      <DonationToggleModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        onConfirm={(date) => {
          setIsReadyToDonate(true);
          const normalizedDate = date === "Not specified" ? null : date;
          void updateProfileStatus(true, normalizedDate);
        }}
      />

      {/* GSAP Fluid Background */}
      <FluidBackground />
    </div>
  );
}
