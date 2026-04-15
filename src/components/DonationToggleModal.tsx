import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, CheckCircle2 } from "lucide-react";

interface DonationToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
}

export default function DonationToggleModal({ isOpen, onClose, onConfirm }: DonationToggleModalProps) {
  const [date, setDate] = useState("");

  const handleConfirm = () => {
    onConfirm(date || "Not specified");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white/10 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Last Donation</h3>
              <p className="mt-2 text-xs font-medium text-white/40 leading-relaxed">
                To ensure your safety and the quality of blood, please provide your last donation date.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Approximate Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                  Skip
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Status
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
