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
import { useState, useEffect, useRef } from "react";

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

export default function Home() {
  const profileIntentHandledRef = useRef(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [isProfileView, setIsProfileView] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isReadyToDonate, setIsReadyToDonate] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
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
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setSessionUser(null);
          return;
        }

        const data = await res.json();
        setSessionUser(data.user || null);
      } catch (error) {
        setSessionUser(null);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (!sessionUser || !isProfileView) return;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/me/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const payload = await res.json();
        if (!payload.success) return;

        setProfileData(payload.data);
        setIsReadyToDonate(Boolean(payload.data.isActiveDonor));
      } catch (error) {
        // keep UI state as-is
      }
    };

    void loadProfile();
  }, [isProfileView, sessionUser]);

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
    <div className="relative min-h-screen">
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
            <UnifiedDashboard
              isReady={isReadyToDonate}
              onToggleReady={handleToggleReady}
              profile={profileData}
            />
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
