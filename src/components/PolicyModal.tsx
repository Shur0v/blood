import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, FileText, AlertTriangle, CheckCircle2, X } from "lucide-react";

/**
 * HEMAFLOW POLICY COMPONENT SUITE
 * ---------------------------------------------------------
 * Description: Implements high-end Glassmorphic modals for 
 * quick-read terms and privacy summaries.
 * UI Consistency: Matches frosted-glass design with #FF3131 accents.
 * ---------------------------------------------------------
 */

const POLICY_DATA = {
  transport: "Recipient covers 100% round-trip donor transport costs.",
  safety: "CRITICAL: Never pay any money before the donor arrives at the hospital.",
  data: "Your HemaID (Phone+DOB) is SHA protocols encrypted on our secure medical servers.",
  control: "Your profile is hidden until you toggle the 'Available' switch.",
  zeroFee: "HemaFlow is 100% free to use. We never charge for matching.",
  noTracking: "We use self-hosted, anonymous analytics to protect your identity."
};

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const PolicyModal = ({ isOpen, onClose, type }: PolicyModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white/10 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                {type === 'terms' ? <FileText className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                {type === 'terms' ? 'Terms of Service' : 'Privacy Summary'}
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Critical Safety Warning */}
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <div className="mb-1 flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Safety Protocol</span>
                </div>
                <p className="text-sm font-bold text-white leading-relaxed">
                  {POLICY_DATA.safety}
                </p>
              </div>

              {/* Policy Points */}
              <div className="space-y-4">
                {type === 'terms' ? (
                  <>
                    <PolicyPoint 
                      icon={<CheckCircle2 className="h-4 w-4" />} 
                      title="Transportation" 
                      description={POLICY_DATA.transport} 
                    />
                    <PolicyPoint 
                      icon={<CheckCircle2 className="h-4 w-4" />} 
                      title="Zero-Fee Platform" 
                      description={POLICY_DATA.zeroFee} 
                    />
                  </>
                ) : (
                  <>
                    <PolicyPoint 
                      icon={<CheckCircle2 className="h-4 w-4" />} 
                      title="SHA protocols Encryption" 
                      description={POLICY_DATA.data} 
                    />
                    <PolicyPoint 
                      icon={<CheckCircle2 className="h-4 w-4" />} 
                      title="Full Privacy Control" 
                      description={POLICY_DATA.control} 
                    />
                    <PolicyPoint 
                      icon={<CheckCircle2 className="h-4 w-4" />} 
                      title="Anonymous Analytics" 
                      description={POLICY_DATA.noTracking} 
                    />
                  </>
                )}
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90"
            >
              I Understand & Agree
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function PolicyPoint({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 text-primary opacity-80">{icon}</div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-white/60 mb-1">{title}</h4>
        <p className="text-sm font-medium text-white/90 leading-snug">{description}</p>
      </div>
    </div>
  );
}
