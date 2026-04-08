/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ImageSlider from "./components/ImageSlider";
import FloatingDonorTags from "./components/FloatingDonorTags";
import CTA from "./components/CTA";
import SocialMedia, { Footer } from "./components/SocialMedia";
import FluidBackground from "./components/FluidBackground";
import { motion, useScroll, useSpring } from "motion/react";

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative min-h-screen">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] h-1.5 origin-left bg-blood-red shadow-lg shadow-blood-red/50"
        style={{ scaleX }}
      />

      <Navbar />
      
      <main>
        <Hero />
        
        <ImageSlider />

        <FloatingDonorTags />

        <CTA />

        <SocialMedia />
      </main>

      <Footer />

      {/* GSAP Fluid Background */}
      <FluidBackground />
    </div>
  );
}
