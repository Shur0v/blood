import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Calendar, Phone, ArrowRight, ShieldCheck, User, MapPin, ChevronDown } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"register" | "otp">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    phone: "",
    bloodGroup: ""
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bloodGroup) {
      setErrorMsg("Please select a blood group.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    console.log("[AuthAPI] Initiating OTP Request for:", formData.email);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();

      if (!res.ok) {
        console.warn("[AuthAPI] Failed OTP Request:", data);
        setErrorMsg(data.error || "Failed to send OTP email.");
        return;
      }

      console.log("[AuthAPI] OTP Dispatched successfully via Nodemailer.");
      setStep("otp");
    } catch (err) {
      console.error("[AuthAPI] Network/System error on OTP request:", err);
      setErrorMsg("System connection error. Please verify status.");
    } finally {
      setIsLoading(false);
    }
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

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    console.log("[AuthAPI] Verifying OTP structure for:", formData.email);

    try {
      const payload = {
        email: formData.email,
        otp: fullOtp,
        name: formData.name,
        city: formData.city,
        bloodGroup: formData.bloodGroup,
        mobile: formData.phone,
        country: "Unknown (Pending Map API)",
        lat: 0.0,
        lng: 0.0
      };

      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn("[AuthAPI] OTP Verification Rejected:", data);
        setErrorMsg(data.error || "Invalid or expired OTP code.");
        return;
      }

      console.log("[AuthAPI] Authentication Successful! Active Session Details:", data.user);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("[AuthAPI] Network error during verification:", err);
      setErrorMsg("System error verifying OTP.");
    } finally {
      setIsLoading(false);
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">
                {step === "register" ? "Join BloodNet" : "Verify Identity"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {step === "register"
                  ? "Create your life-saver profile in seconds."
                  : "We've sent a 6-digit code to your email."}
              </p>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      required
                      type="text"
                      placeholder="John Doe"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      required
                      type="email"
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">City Near You</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Dhaka"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group</label>
                    <div className="relative">
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full cursor-pointer flex justify-between items-center rounded-2xl border border-white/10 bg-white/5 py-4 px-4 text-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 ${!formData.bloodGroup ? 'text-white/40' : 'text-white font-medium'}`}
                      >
                        {formData.bloodGroup || 'Select'}
                        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsDropdownOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 w-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-2xl p-2 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
                            >
                              {BLOOD_GROUPS.map(bg => (
                                <div
                                  key={bg}
                                  onClick={() => {
                                    setFormData({ ...formData, bloodGroup: bg });
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-bold transition-all ${formData.bloodGroup === bg
                                      ? 'bg-primary border border-primary/50 text-white'
                                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                  {bg}
                                </div>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
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
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="group mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Send OTP to Email"}
                  {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
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
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/5 text-center text-xl font-black text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </motion.button>
                  <button
                    onClick={() => setStep("register")}
                    className="w-full text-xs font-bold text-white/40 transition-colors hover:text-white"
                  >
                    Change email address?
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
