import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, ShieldCheck, CheckCircle2, DollarSign, Lock, AlertCircle, Info } from "lucide-react";

interface DonateNowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DONATION_TIERS = [
  {
    amount: 5,
    title: "STUDENT ACCESS",
    details: [
      "Complete digital edition",
      "Instant PDF download",
      "Read on any device"
    ],
    impact:
      "Get instant access to Current Essentials of Medicine while supporting our medical education project.",
    icon: "📘",
  },
  {
    amount: 15,
    title: "MOST POPULAR",
    details: [
      "Complete digital edition",
      "Lifetime updates",
      "Helps sponsor community access"
    ],
    impact:
      "Your purchase unlocks the complete book and helps make trusted medical resources accessible to more learners.",
    icon: "⭐",
  },
  {
    amount: 30,
    title: "SUPPORTER EDITION",
    details: [
      "Complete digital edition",
      "Lifetime updates",
      "Helps expand free access"
    ],
    impact:
      "Support the project while receiving the full digital edition and contributing to future improvements.",
    icon: "🎓",
  },
  {
    amount: 50,
    title: "COMMUNITY CHAMPION",
    details: [
      "Complete digital edition",
      "Priority future updates",
      "Sponsors more free copies"
    ],
    impact:
      "Your generous purchase helps us provide more sponsored copies to students and healthcare professionals.",
    icon: "❤️",
  },
];

// const DONATION_TIERS = [
//   {
//     amount: 5,
//     title: "Basic Medical Support",
//     details: ["Essential medicines", "Syringe & basic supplies", "First response support"],
//     impact: "Your $5 can provide immediate essential medicines for emergency arrivals.",
//     icon: "💊",
//   },
//   {
//     amount: 15,
//     title: "1 Day Medical Cost",
//     details: ["Basic hospital support", "Emergency blood processing", "Initial treatment"],
//     impact: "Your $15 can support a patient's critical treatment for one full day.",
//     icon: "🏥",
//   },
//   {
//     amount: 30,
//     title: "Emergency Support",
//     details: ["Blood donor coordination", "Lab testing assistance", "Medical transport"],
//     impact: "Your $30 covers extensive lab testing and rapid emergency transportation.",
//     icon: "🚑",
//   },
//   {
//     amount: 50,
//     title: "Critical Patient Support",
//     details: ["Multiple day treatment", "Blood + medicine assistance", "Priority response"],
//     impact: "Your $50 provides comprehensive multi-day treatment for a critical patient.",
//     icon: "❤️‍🩹",
//   }
// ];

export default function DonateNowModal({ isOpen, onClose }: DonateNowModalProps) {
  const [selectedTier, setSelectedTier] = useState<number>(15);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [weeklyDonors, setWeeklyDonors] = useState<number>(36);

  useEffect(() => {
    if (!isOpen) return;

    const loadWeeklyDonors = async () => {
      try {
        const res = await fetch("/api/public/platform-stats", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !payload.data) return;
        const next = Number(payload.data.weekly_donors);
        if (Number.isFinite(next) && next >= 0) {
          setWeeklyDonors(next);
        }
      } catch (error) {
        // keep last known value
      }
    };

    void loadWeeklyDonors();
  }, [isOpen]);

  // Derive active amount safely
  const activeAmountRaw = customAmount !== "" ? parseFloat(customAmount) : selectedTier;
  // Make sure minimum logic applies if user enters something < 50
  const isCustomEnabled = customAmount !== "";
  const isValidCustomAmount = isCustomEnabled ? activeAmountRaw >= 50 : true;
  const activeAmount = activeAmountRaw || 0;

  // Find current tier context (or default to custom context)
  const activeContext =
    isCustomEnabled ?
      // { impact: `Your massive $${activeAmount || 0} contribution directly funds live-saving operations, ICU beds, and vital medicines.`, title: "Custom Heavy Donation" }
      { impact: `Your $${activeAmount || 0} purchase gives you instant access to the complete digital edition while supporting future updates and free community access.`, title: "Custom Heavy Support" }
      : DONATION_TIERS.find(t => t.amount === selectedTier) || DONATION_TIERS[0];

  const handleDonate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.5, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl flex flex-col max-h-[90vh] z-10"
          >
            {/* Header section fixed */}
            <div className="bg-white px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Heart className="h-6 w-6 text-[#FF3131] fill-[#FF3131]" />
                  {/* Support a Life Today */}
                  Get Current Essentials of Medicine
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-sm leading-relaxed">
                  Choose any amount to access the complete digital edition. Every purchase helps us improve and provide trusted medical resources for everyone.
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-8 custom-scrollbar pb-32 sm:pb-8">

              {/* Card Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  {/* <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Select Donation Amount</h3> */}
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">CHOOSE YOUR PRICE</h3>
                  <span className="text-[10px] font-bold text-[#FF3131] bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                    {/* <Heart className="h-3 w-3 fill-current" /> {weeklyDonors} people donated this week */}
                    <Heart className="h-3 w-3 fill-current" /> {weeklyDonors} people purchased this week
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DONATION_TIERS.map((tier) => {
                    const isSelected = selectedTier === tier.amount && !isCustomEnabled;
                    return (
                      <div
                        key={tier.amount}
                        onClick={() => {
                          setSelectedTier(tier.amount);
                          setCustomAmount("");
                        }}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${isSelected
                          ? "border-[#FF3131] bg-red-50/30 shadow-[0_4px_20px_-5px_rgba(255,49,49,0.2)] scale-[1.02]"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 hover:scale-[1.01]"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-[#FF3131]">
                            <CheckCircle2 className="h-5 w-5 fill-[#FF3131] text-white" />
                          </div>
                        )}

                        <div className="flex items-end gap-2 mb-3">
                          <span className="text-3xl font-black text-gray-900 leading-none">${tier.amount}</span>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{tier.title}</span>
                        </div>

                        <ul className="space-y-1">
                          {tier.details.map((detail, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-center gap-1.5">
                              <div className={`h-1 w-1 rounded-full ${isSelected ? "bg-[#FF3131]" : "bg-gray-300"}`}></div>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Amount Card - Full Width below the grid */}
                <div
                  onClick={() => {
                    if (customAmount === "") setCustomAmount("50");
                  }}
                  className={`mt-4 cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 flex flex-col justify-center w-full ${isCustomEnabled
                    ? isValidCustomAmount
                      ? "border-[#FF3131] bg-red-50/30 shadow-[0_4px_20px_-5px_rgba(255,49,49,0.2)] scale-[1.01]"
                      : "border-orange-500 bg-orange-50/30 scale-[1.01]"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Custom Amount</p> */}
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">PAY YOUR OWN PRICE</p>
                    {!isValidCustomAmount && isCustomEnabled && (
                      <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Minimum allowed is $05
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      min="05"
                      placeholder="Enter amount"
                      className={`w-full bg-white border rounded-xl py-4 pl-10 pr-4 text-gray-900 font-black text-xl focus:outline-none transition-shadow ${isCustomEnabled && !isValidCustomAmount ? "border-orange-500 focus:ring-orange-500/20" : "border-gray-200 focus:border-[#FF3131] focus:ring-1 focus:ring-[#FF3131]"
                        }`}
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Impact Display */}
              <motion.div
                layout
                className="bg-[#1a1a2e] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Heart className="w-24 h-24 text-white" />
                </div>
                {/* <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF3131] mb-2">Your Direct Impact</h4> */}
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF3131] mb-2">Your Impact</h4>
                <motion.p
                  key={activeContext.impact}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg sm:text-xl font-medium leading-relaxed max-w-[90%] font-serif"
                >
                  "{activeContext?.impact}"
                </motion.p>
              </motion.div>

              {/* Transparency Breakdown Chart */}
              <div className="pt-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                  {/* <Info className="h-4 w-4" /> Fund Allocation Transparency */}
                  <Info className="h-4 w-4" /> HOW YOUR PURCHASE HELPS
                </h3>

                <div className="space-y-4">
                  {/* 90% */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      {/* <span>Live Saving Operations, ICU & Medicine Costs</span> */}
                      <span>Medical Content Updates & New Editions</span>
                      <span>90%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ delay: 0.1, duration: 1 }}
                        className="h-full bg-[#1a1a2e]"
                      ></motion.div>
                    </div>
                  </div>
                  {/* 9% */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      {/* <span>Blood Processing Operations</span> */}
                      <span>Website Hosting & Secure Delivery</span>
                      <span>9%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: "9%" }} transition={{ delay: 0.3, duration: 1 }}
                        className="h-full bg-[#FF3131]"
                      ></motion.div>
                    </div>
                  </div>
                  {/* 1% */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      {/* <span>Zero-Profit Platform Running Cost</span> */}
                      <span>Free Community Access Program</span>
                      <span>1%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: "1%" }} transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-gray-300"
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions Fixed Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sticky bottom-0 z-20">
              <div className="flex-1 w-full flex items-center justify-center sm:justify-start gap-2 text-gray-500">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">SSL Secure 256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors rounded-xl hidden sm:block"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessing || (isCustomEnabled && !isValidCustomAmount)}
                  onClick={handleDonate}
                  className="flex-1 sm:flex-none relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF3131] to-rose-600 px-10 py-4 font-black uppercase tracking-widest text-white shadow-xl hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {/* {isProcessing ? "Processing..." : `Continue to Donate ${activeAmount ? '$' + activeAmount : ''}`} */}
                  {isProcessing ? "Processing..." : `GET THE BOOK ${activeAmount ? '$' + activeAmount : ''}`}
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
