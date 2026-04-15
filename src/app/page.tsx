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
import MobilePreview from "../components/MobilePreview";
import { PolicyModal } from "../components/PolicyModal";
import { FullPrivacyPage } from "../components/FullPrivacyPage";
import AuthModal from "../components/AuthModal";
import UnifiedDashboard from "../components/UnifiedDashboard";
import DonationToggleModal from "../components/DonationToggleModal";
import MedicalAidFund from "../components/MedicalAidFund";
import { motion, useScroll, useSpring } from "motion/react";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isReadyToDonate, setIsReadyToDonate] = useState(true);
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

  const handleAuthClick = () => {
    if (isLoggedIn) {
      // Toggle profile view or similar
      setCurrentPage("home");
      window.scrollTo({ top: 400, behavior: "smooth" });
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleToggleReady = (ready: boolean) => {
    if (ready) {
      setIsDonationModalOpen(true);
    } else {
      setIsReadyToDonate(false);
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
        onPageChange={setCurrentPage}
        onAuthClick={handleAuthClick}
        isLoggedIn={isLoggedIn}
      />

      <main>
        {currentPage === "home" && (
          <>
            <Hero />

            {isLoggedIn && (
              <div className="mx-auto max-w-7xl px-4 py-8">
                <UnifiedDashboard
                  isReady={isReadyToDonate}
                  onToggleReady={handleToggleReady}
                />
              </div>
            )}

            <ProcessSteps />
            <ImageSlider />
            <MedicalAidFund />
            <FloatingDonorTags />
            <ImpactData />
            <RequestOrgan />
            <Testimonials />
            <UserReports />
            <MobilePreview />
            <CTA />
            <SocialMedia />
          </>
        )}

        {currentPage === "organ" && (
          <>
            <OrganHero />

            {isLoggedIn && (
              <div className="mx-auto max-w-7xl px-4 py-8">
                <UnifiedDashboard
                  isReady={isReadyToDonate}
                  onToggleReady={handleToggleReady}
                />
              </div>
            )}

            <ProcessSteps />
            <ImageSlider />
            <FloatingDonorTags />
            <ImpactData />
            <RequestOrgan />
            <Testimonials />
            <UserReports />
            <MobilePreview />
            <CTA />
            <SocialMedia />
          </>
        )}

        {currentPage === "blog" && (
          <div className="flex min-h-screen items-center justify-center pt-20">
            <div className="glass rounded-[8px] p-12 text-center max-w-2xl mx-4">
              <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Medical Insights</h1>
              <p className="text-gray-500 mb-8">Stay updated with the latest breakthroughs in hematology and transplant medicine.</p>
              <div className="grid gap-6 text-left">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 rounded-[8px] border border-white/40 bg-white/10 hover:bg-white/20 transition-all cursor-pointer">
                    <div className="text-primary-dark text-[10px] font-bold uppercase mb-2 tracking-widest">Medical News • 2 hours ago</div>
                    <h3 className="font-bold text-lg mb-2">The Future of Artificial Blood: A New Era in Emergency Care</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">Researchers have developed a synthetic alternative that could revolutionize how we handle trauma cases in remote areas...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentPage === "privacy-policy" && <FullPrivacyPage />}
      </main>

      <Footer
        onOpenPolicy={(type) => setPolicyModal({ isOpen: true, type })}
        onPageChange={setCurrentPage}
      />

      <PolicyModal
        isOpen={policyModal.isOpen}
        type={policyModal.type}
        onClose={() => setPolicyModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsLoggedIn(true)}
      />

      <DonationToggleModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        onConfirm={() => setIsReadyToDonate(true)}
      />

      {/* GSAP Fluid Background */}
      <FluidBackground />
    </div>
  );
}
