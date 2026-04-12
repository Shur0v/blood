import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Calendar, Phone, ArrowRight, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"register" | "otp">("register");
  const [formData, setFormData] = useState({
    email: "",
    dob: "",
    phone: "",
    bloodGroup: ""
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("otp");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.every(digit => digit !== "")) {
      onSuccess();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass relative w-full max-w-md overflow-hidden rounded-[32px] bg-white/10 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-red/20 text-accent-red">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">
                {step === "register" ? "Join HemaFlow" : "Verify Identity"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {step === "register" 
                  ? "Create your life-saver profile in seconds." 
                  : "We've sent a 6-digit code to your phone."}
              </p>
            </div>

            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      required
                      type="email"
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-accent-red/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        required
                        type="date"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white focus:border-accent-red/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group</label>
                    <select
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 px-4 text-white focus:border-accent-red/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50 appearance-none"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="" disabled className="bg-[#101828]">Select</option>
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg} className="bg-[#101828]">{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      required
                      type="tel"
                      placeholder="+1..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-accent-red/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="group mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-accent-red to-soft-crimson py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-accent-red/20 transition-all hover:opacity-90"
                >
                  Send OTP
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/5 text-center text-xl font-black text-white focus:border-accent-red/50 focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerify}
                    className="w-full rounded-2xl bg-gradient-to-r from-accent-red to-soft-crimson py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-accent-red/20 transition-all hover:opacity-90"
                  >
                    Verify & Login
                  </motion.button>
                  <button 
                    onClick={() => setStep("register")}
                    className="w-full text-xs font-bold text-white/40 transition-colors hover:text-white"
                  >
                    Change phone number?
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
