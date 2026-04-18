import React from "react";
import { motion } from "motion/react";
import { Smartphone, Bell, Shield, Heart } from "lucide-react";

export default function MobilePreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="flex flex-col items-center justify-between gap-16 md:flex-row">
        {/* Left Side: Mockup */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="relative flex-[0.45]"
        >
          {/* Phone Mockup Container */}
          <div className="relative mx-auto h-[600px] w-[300px] rounded-[40px] border-[8px] border-gray-900 bg-gray-900 shadow-card">
            {/* Screen Content */}
            <div className="h-full w-full overflow-hidden rounded-[32px] bg-white p-4">
              {/* Status Bar */}
              <div className="mb-6 flex justify-between px-2">
                <span className="text-[10px] font-bold">9:41</span>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-black" />
                  <div className="h-2 w-2 rounded-full bg-black" />
                </div>
              </div>

              {/* App Header */}
              <div className="mb-8 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white fill-white" />
                </div>
                <span className="text-sm font-black tracking-tight">BloodNet</span>
              </div>

              {/* Mockup UI Elements */}
              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-2 h-2 w-20 rounded-full bg-gray-200" />
                  <div className="h-2 w-full rounded-full bg-gray-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="aspect-square rounded-2xl bg-primary/5 p-4 flex flex-col items-center justify-center">
                    <Bell className="h-6 w-6 text-primary mb-2" />
                    <span className="text-[8px] font-bold uppercase">Alerts</span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-gray-900 p-4 flex flex-col items-center justify-center text-white">
                    <Shield className="h-6 w-6 mb-2" />
                    <span className="text-[8px] font-bold uppercase">Verify</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="space-y-1">
                      <div className="h-2 w-24 rounded-full bg-gray-200" />
                      <div className="h-1.5 w-16 rounded-full bg-gray-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
          </div>

          {/* Floating Glows */}
          <div className="absolute -top-10 -left-10 -z-10 h-40 w-40 rounded-full bg-primary-dark/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 -z-10 h-40 w-40 rounded-full bg-blue-400/5 blur-3xl" />
        </motion.div>

        {/* Right Side: Text Block */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="flex-[0.5] text-center md:text-left"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-primary">
            <Smartphone className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Mobile Experience</span>
          </div>
          
          <h2 className="mb-6 text-5xl font-black tracking-tight text-gray-900 md:text-6xl">
            Life-saving <br />
            <span className="text-primary">in your pocket.</span>
          </h2>
          
          <p className="mb-8 text-lg leading-relaxed text-gray-500 font-medium">
            We're building the most advanced blood donation app ever conceived. Real-time tracking, instant matching, and a secure medical wallet.
          </p>

          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-gray-900 px-8 text-white shadow-xl transition-transform hover:scale-105">
              <span className="text-sm font-bold uppercase tracking-widest opacity-50">Coming Soon to</span>
              <span className="text-lg font-black">App Store</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Beta testing in progress</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
