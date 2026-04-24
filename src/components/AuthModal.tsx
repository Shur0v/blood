import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, ArrowRight, ShieldCheck, User, MapPin, ChevronDown, CheckCircle2, CalendarDays } from "lucide-react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/min";
import WheelDatePickerModal from "@/src/components/WheelDatePickerModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; name: string; email: string; role: string }) => void;
}

interface LocationSuggestion {
  city: string;
  country: string;
  formatted_location: string;
  latitude: number;
  longitude: number;
  provider_place_id: string;
  token: string;
}

interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: COUNTRY_NAMES.of(code) ?? code,
    dialCode: `+${getCountryCallingCode(code)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"register" | "otp">("register");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bloodGroup: "",
    dateOfBirth: "",
  });
  const [phoneData, setPhoneData] = useState({
    countryName: "",
    countryCode: "",
    dialCode: "",
    localPhoneNumber: "",
    fullPhoneNumber: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<LocationSuggestion[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [locationLookupError, setLocationLookupError] = useState("");
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const MAX_CITIES = 5;
  const currentYear = new Date().getFullYear();
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 18);
  const minDobDate = new Date(currentYear - 100, 0, 1);
  const minCharsReached = locationInput.trim().length >= 2;
  const normalizedCountrySearch = countrySearch.trim().toLowerCase();
  const filteredCountryOptions = COUNTRY_OPTIONS.filter((item) => {
    if (!normalizedCountrySearch) {
      return true;
    }
    return (
      item.name.toLowerCase().includes(normalizedCountrySearch) ||
      item.code.toLowerCase().includes(normalizedCountrySearch) ||
      item.dialCode.includes(normalizedCountrySearch)
    );
  });

  const validatePhoneForCountry = (nextLocalNumber: string, countryCode: string, dialCode: string) => {
    const digits = nextLocalNumber.replace(/\D/g, "");
    if (!countryCode || !dialCode) {
      return { valid: false, error: "Please select a country first.", fullNumber: "" };
    }
    if (!digits) {
      return { valid: false, error: "Please enter your local phone number.", fullNumber: "" };
    }
    if (digits.startsWith("0")) {
      return { valid: false, error: "Enter local number without leading 0.", fullNumber: "" };
    }

    const fullNumber = `${dialCode}${digits}`;
    const lengthReason = validatePhoneNumberLength(fullNumber, countryCode as CountryCode);
    if (lengthReason === "TOO_SHORT") {
      return { valid: false, error: "Phone number is too short for selected country.", fullNumber: "" };
    }
    if (lengthReason === "TOO_LONG") {
      return { valid: false, error: "Phone number is too long for selected country.", fullNumber: "" };
    }
    if (lengthReason === "INVALID_LENGTH") {
      return { valid: false, error: "Phone number length is invalid for selected country.", fullNumber: "" };
    }

    const parsed = parsePhoneNumberFromString(fullNumber, countryCode as CountryCode);
    if (!parsed || !parsed.isValid()) {
      return { valid: false, error: "Invalid phone format for selected country.", fullNumber: "" };
    }
    if (parsed.country && parsed.country !== countryCode) {
      return { valid: false, error: "Phone number does not match selected country.", fullNumber: "" };
    }

    return { valid: true, error: "", fullNumber: parsed.number };
  };

  const isPhoneValid =
    Boolean(phoneData.countryCode) &&
    Boolean(phoneData.localPhoneNumber) &&
    Boolean(phoneData.fullPhoneNumber) &&
    !phoneError;

  const getDeviceFingerprint = () => {
    if (typeof window === "undefined") return "";
    const key = "bloodnet_device_fp";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const generated = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, generated);
    return generated;
  };

  useEffect(() => {
    if (authMode !== "register") {
      return;
    }
    if (!minCharsReached) {
      setLocationSuggestions([]);
      setLocationLookupError("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        setIsFetchingLocations(true);
        const res = await fetch(`/api/location/cities?text=${encodeURIComponent(locationInput.trim())}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok || !payload.success) {
          setLocationSuggestions([]);
          setLocationLookupError(payload.message || "Location API is not configured.");
          return;
        }
        setLocationSuggestions(payload.data || []);
        setLocationLookupError("");
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        if (error?.name === "AbortError") {
          setLocationSuggestions([]);
          setLocationLookupError("City lookup timed out. Please try again.");
          return;
        }
        setLocationSuggestions([]);
        setLocationLookupError("Failed to connect location API.");
      } finally {
        clearTimeout(timeout);
        if (!cancelled) {
          setIsFetchingLocations(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locationInput, authMode, minCharsReached]);

  const isRegisterSubmitDisabled =
    authMode === "register" &&
    (!formData.name || !formData.email || !formData.bloodGroup || !formData.dateOfBirth || selectedLocations.length === 0 || !isPhoneValid);

  const formatDobLabel = (dob: string) => {
    if (!dob) return "";
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register" && !formData.bloodGroup) {
      setErrorMsg("Please select a blood group.");
      return;
    }
    if (authMode === "register" && selectedLocations.length === 0) {
      setErrorMsg("Please select at least one city from the suggestion list.");
      return;
    }
    if (authMode === "register" && !isPhoneValid) {
      setErrorMsg(phoneError || "Please provide a valid local phone number.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, deviceFingerprint: getDeviceFingerprint() })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send OTP email.");
        return;
      }

      setStep("otp");
    } catch (err) {
      setErrorMsg("System connection error. Please verify status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const updated = [...otp];
    for (let i = 0; i < pasted.length && index + i < updated.length; i += 1) {
      updated[index + i] = pasted[i];
    }
    setOtp(updated);

    const nextIndex = Math.min(index + pasted.length, updated.length - 1);
    const target = document.getElementById(`otp-${nextIndex}`);
    target?.focus();
  };

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        email: formData.email,
        otp: fullOtp,
        deviceFingerprint: getDeviceFingerprint(),
        ...(authMode === "register" && selectedLocations.length > 0 && {
          name: formData.name,
          dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
          bloodGroup: formData.bloodGroup,
          mobile: phoneData.fullPhoneNumber,
          phone: {
            country_name: phoneData.countryName,
            country_code: phoneData.countryCode,
            dial_code: phoneData.dialCode,
            local_phone_number: phoneData.localPhoneNumber,
            full_phone_number: phoneData.fullPhoneNumber,
          },
          locations: selectedLocations,
        })
      };

      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid or expired OTP code.");
        return;
      }

      onSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMsg("System error verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
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
            className="glass relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white/10 p-5 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl sm:rounded-[32px] sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 text-white/50 transition-colors hover:text-white"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="mb-6 sm:mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                {step === "register" ? (authMode === "register" ? "Join BloodNet" : "Login to BloodNet") : "Verify Identity"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {step === "register"
                  ? authMode === "register" ? "Create your life-saver profile in seconds." : "Use your email to receive login OTP."
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

            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-5">
              {step === "register" ? (
                <form onSubmit={handleRequestOtp} noValidate className="space-y-4 pb-0">
                {authMode === "register" && (
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
                )}

                {authMode === "register" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Date of Birth</label>
                    <button
                      type="button"
                      onClick={() => setIsDobPickerOpen(true)}
                      className={`relative w-full rounded-2xl border bg-white/5 py-4 pl-12 pr-4 text-left transition focus:outline-none focus:ring-1 ${
                        formData.dateOfBirth
                          ? "border-emerald-400/60 text-white ring-1 ring-emerald-400/40"
                          : "border-white/10 text-white/40 focus:border-primary/50 focus:ring-primary/50"
                      }`}
                    >
                      <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      {formData.dateOfBirth ? formatDobLabel(formData.dateOfBirth) : "Select your date of birth"}
                    </button>
                  </div>
                )}

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

                {authMode === "register" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Location (City only)</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          placeholder="Search your city"
                          value={locationInput}
                          onChange={(e) => {
                            setLocationInput(e.target.value);
                          }}
                          className={`w-full rounded-2xl border bg-white/5 py-4 pl-12 pr-20 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
                            selectedLocations.length > 0
                              ? "border-emerald-400/60 ring-emerald-400/40"
                              : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                          }`}
                        />
                        {isFetchingLocations ? (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">Loading...</span>
                        ) : null}
                      </div>
                      {selectedLocations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedLocations.map((item) => (
                            <span key={item.provider_place_id} className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                              {item.city}, {item.country}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocations((prev) => prev.filter((loc) => loc.provider_place_id !== item.provider_place_id));
                                }}
                                className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-black text-white/90 hover:bg-black/40"
                                aria-label={`Remove ${item.city}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] font-semibold text-white/45">
                        Selected {selectedLocations.length}/{MAX_CITIES} cities
                      </p>
                      {locationLookupError && (
                        <p className="text-xs font-semibold text-amber-300">{locationLookupError}</p>
                      )}

                      {minCharsReached && locationSuggestions.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {locationSuggestions.map((item) => (
                            <button
                              key={item.provider_place_id}
                              type="button"
                              onClick={() => {
                                setLocationInput("");
                                setLocationSuggestions([]);
                                setLocationLookupError("");
                                setSelectedLocations((prev) => {
                                  if (prev.some((loc) => loc.provider_place_id === item.provider_place_id)) {
                                    return prev;
                                  }
                                  if (prev.length >= MAX_CITIES) {
                                    setErrorMsg(`Maximum ${MAX_CITIES} cities allowed.`);
                                    return prev;
                                  }
                                  return [...prev, item];
                                });
                              }}
                              className="w-full text-left rounded-xl px-3 py-2.5 transition bg-transparent hover:bg-white/10"
                            >
                              <p className="text-sm font-semibold text-white">{item.city}</p>
                              <p className="text-xs text-white/60">{item.country}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {minCharsReached && !isFetchingLocations && locationSuggestions.length === 0 && (
                        <p className="text-xs font-medium text-white/50">No city-only matches found.</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group</label>
                        <div className="relative">
                          <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full cursor-pointer flex justify-between items-center rounded-2xl border border-white/10 bg-white/5 py-4 px-4 text-sm ${!formData.bloodGroup ? "text-white/40" : "text-white font-medium"}`}
                          >
                            {formData.bloodGroup || "Select"}
                            <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                          </div>

                          <AnimatePresence>
                            {isDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute top-full left-0 w-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-2xl p-2 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
                                >
                                  {BLOOD_GROUPS.map((bg) => (
                                    <div
                                      key={bg}
                                      onClick={() => {
                                        setFormData({ ...formData, bloodGroup: bg });
                                        setIsDropdownOpen(false);
                                      }}
                                      className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-bold transition-all ${formData.bloodGroup === bg
                                        ? "bg-primary border border-primary/50 text-white"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
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

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone Number</label>
                        <div className="space-y-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                              className={`w-full flex items-center justify-between rounded-2xl border bg-white/5 px-4 py-4 text-sm transition ${
                                phoneData.countryCode
                                  ? "border-emerald-400/60 text-white ring-1 ring-emerald-400/40"
                                  : "border-white/10 text-white/60"
                              }`}
                            >
                              <span className="truncate">
                                {phoneData.countryCode
                                  ? `${phoneData.countryName} (${phoneData.dialCode})`
                                  : "Select country"}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                              {isCountryDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#1a1a2e]/95 p-2 backdrop-blur-2xl shadow-2xl"
                                  >
                                    <input
                                      type="text"
                                      placeholder="Search country..."
                                      className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                    />
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                      {filteredCountryOptions.map((country) => (
                                        <button
                                          key={country.code}
                                          type="button"
                                          onClick={() => {
                                            setPhoneData({
                                              countryName: country.name,
                                              countryCode: country.code,
                                              dialCode: country.dialCode,
                                              localPhoneNumber: "",
                                              fullPhoneNumber: "",
                                            });
                                            setPhoneError("Please enter your local phone number.");
                                            setIsCountryDropdownOpen(false);
                                            setCountrySearch("");
                                          }}
                                          className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                                        >
                                          {country.name} ({country.dialCode})
                                        </button>
                                      ))}
                                      {filteredCountryOptions.length === 0 && (
                                        <p className="px-3 py-2 text-xs text-white/50">No country found.</p>
                                      )}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          <div
                            className={`flex items-center rounded-2xl border bg-white/5 ${
                              phoneError
                                ? "border-red-400/60 ring-1 ring-red-400/40"
                                : "border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50"
                            }`}
                          >
                            <span className="pl-4 pr-3 text-sm font-bold text-white/75">
                              {phoneData.dialCode || "+--"}
                            </span>
                            <span className="mr-3 h-5 w-px bg-white/15" />
                            <input
                              required
                              type="tel"
                              inputMode="numeric"
                              placeholder="Enter local number"
                              className="w-full bg-transparent py-4 pr-4 text-white placeholder:text-white/25 focus:outline-none"
                              value={phoneData.localPhoneNumber}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                if (!phoneData.countryCode || !phoneData.dialCode) {
                                  setPhoneError("Please select a country first.");
                                  return;
                                }
                                if (rawValue.includes("+")) {
                                  setPhoneError("Enter local number only, without country code.");
                                  return;
                                }

                                const digitsOnly = rawValue.replace(/\D/g, "");
                                const dialDigits = phoneData.dialCode.replace("+", "");
                                if (digitsOnly.startsWith(dialDigits) && digitsOnly.length > dialDigits.length + 3) {
                                  setPhoneError("Do not include country code in local number.");
                                  return;
                                }

                                const result = validatePhoneForCountry(digitsOnly, phoneData.countryCode, phoneData.dialCode);
                                setPhoneData((prev) => ({
                                  ...prev,
                                  localPhoneNumber: digitsOnly,
                                  fullPhoneNumber: result.valid ? result.fullNumber : "",
                                }));
                                setPhoneError(result.error);
                              }}
                            />
                          </div>
                          {phoneError && <p className="text-xs font-semibold text-red-300">{phoneError}</p>}
                          {!phoneError && isPhoneValid && (
                            <p className="text-xs font-semibold text-emerald-300">Number looks good</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isRegisterSubmitDisabled}
                  className="group mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Send OTP to Email"}
                  {!isLoading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "register" ? "login" : "register");
                    setErrorMsg("");
                    setSelectedLocations([]);
                    setLocationInput("");
                    setLocationSuggestions([]);
                    setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
                    setPhoneData({
                      countryName: "",
                      countryCode: "",
                      dialCode: "",
                      localPhoneNumber: "",
                      fullPhoneNumber: "",
                    });
                    setPhoneError("");
                    setCountrySearch("");
                    setIsCountryDropdownOpen(false);
                  }}
                  className="w-full text-xs font-bold text-white/40 transition-colors hover:text-white"
                >
                  {authMode === "register" ? "Already have an account? Login" : "Need a new account? Register"}
                </button>
                </form>
              ) : (
                <div className="space-y-8 pb-4">
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="h-12 sm:h-14 min-w-0 w-full rounded-xl border border-white/10 bg-white/5 text-center text-lg sm:text-xl font-black text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onPaste={(e) => handleOtpPaste(index, e)}
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
            </div>

            <WheelDatePickerModal
              isOpen={isDobPickerOpen}
              onClose={() => setIsDobPickerOpen(false)}
              onConfirm={(value) => {
                setFormData((prev) => ({ ...prev, dateOfBirth: value }));
                setErrorMsg("");
              }}
              initialDate={formData.dateOfBirth}
              title="Select Date of Birth"
              subtitle="Use arrows and keep the selected value in the center row."
              confirmLabel="Confirm Date of Birth"
              minDate={minDobDate}
              maxDate={maxDobDate}
              theme="dark"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
