import React from "react";
import { motion } from "motion/react";
import { Heart, ShieldCheck, ExternalLink, CreditCard, Lock, CheckCircle2 } from "lucide-react";

export default function MedicalAidFund() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[40px] border border-white/40 bg-white/40 p-8 backdrop-blur-[25px] shadow-[0_32px_64px_-12px_rgba(16,24,40,0.14)] md:p-12"
      >
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-red/10 text-accent-red">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[#101828] md:text-4xl">
              HemaFlow Medical Aid Fund: <span className="text-accent-red">Support a Life-Saving Transplant</span>
            </h2>
          </div>
          <p className="text-lg font-medium text-[#101828]/60">
            Bridge the financial gap for underprivileged patients. 100% of your donation covers direct medical costs; we cover operational fees.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* LEFT SIDE: Active Cases */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Active Cases (Radical Transparency)</h3>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-600">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Updates
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass rounded-3xl border border-white/60 bg-white/20 p-6 shadow-sm backdrop-blur-md"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md">
                    <img 
                      src="https://i.pravatar.cc/150?u=ayesha" 
                      alt="Ayesha" 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-[#101828]">Ayesha's Kidney Transplant Fund</h4>
                    <p className="text-[10px] font-bold text-[#101828]/40 uppercase tracking-wider">Dhaka Medical College</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <span className="text-accent-red">75% Raised</span>
                    <span className="text-[#101828]">$3,750 / $5,000</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#101828]/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-accent-red to-[#FF3131]/60"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#101828]/40 uppercase tracking-widest">125 Donors Contributed</p>
                    <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-accent-red hover:underline">
                      [View Audit Report] <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CENTER: Giving Tiers */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Tangible Giving Tiers</h3>
            <div className="flex flex-col gap-4">
              {[
                { amount: "$25", impact: "Post-op Medication" },
                { amount: "$50", impact: "Pre-op Blood Units" },
                { amount: "$100", impact: "1 Day ICU Bed" },
                { amount: "Custom", impact: "Choose Amount" }
              ].map((tier, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center rounded-2xl border border-white/60 bg-white/30 py-3 px-4 shadow-sm backdrop-blur-sm transition-all"
                >
                  <span className="text-lg font-black text-[#101828] group-hover:text-accent-red transition-colors">{tier.amount}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#101828]/40">{tier.impact}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Payment & Legal */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(255, 49, 49, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-gradient-to-r from-accent-red to-[#FF3131]/80 py-5 px-8 text-sm font-black uppercase tracking-[2px] text-white shadow-xl"
              >
                Confirm and Donate Securely via Stripe
              </motion.button>

              <div className="flex flex-wrap items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Stripe Partner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-accent-red/5 p-4 ring-1 ring-accent-red/10">
              <p className="text-[10px] font-bold leading-relaxed text-[#101828]/80">
                <span className="font-black text-accent-red uppercase tracking-widest block mb-1">Mandatory Legal Disclaimer:</span>
                HemaFlow is strictly a <span className="font-black">Medical Aid Fund</span>. Donations support surgery costs. <span className="font-black text-accent-red">We prohibit the exchange of funds for organ acquisition or trading.</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
