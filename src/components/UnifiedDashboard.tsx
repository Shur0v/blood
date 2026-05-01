import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Thermometer, 
  CheckCircle2,
  Circle,
  MapPin,
  Droplet,
  Power,
  Upload,
  ChevronRight,
  Info,
  BookOpen,
  Ghost,
  Send,
  Camera,
  UserCircle2
} from "lucide-react";
import OrganIcon from "./OrganIcon";
import { ORGAN_CATALOG, normalizeOrganList } from "../lib/organCatalog";

const VACCINES = ["COVID-19", "HBV", "BCG", "Influenza", "MMR", "Polio", "Tetanus"];
const ALLERGIES = ["Peanuts", "Penicillin", "Latex", "Pollen", "Dust", "None"];
const ORGANS = ORGAN_CATALOG.map((name) => ({
  name,
  icon: <OrganIcon organ={name} className="h-6 w-6" />,
}));

interface UnifiedDashboardProps {
  isReady: boolean;
  onToggleReady: (ready: boolean) => void;
  onHealthDataSaved?: (healthData: Record<string, unknown>) => void;
  onOrgansSaved?: (organs: string[]) => void;
  onSessionExpired?: () => void;
  mode?: "self" | "admin";
  targetUserId?: string;
  profile: {
    id: string;
    name: string;
    city: string;
    country: string;
    bloodGroup: string;
    verificationStatus: string;
    profileImageUrl?: string | null;
    healthData?: Record<string, unknown>;
    activeOrgans?: string[];
    serviceCities?: Array<{
      id: string;
      city: string;
      country: string;
      formatted_location: string;
      remainingDays: number;
      canRemove: boolean;
    }>;
  } | null;
}

export default function UnifiedDashboard({
  isReady,
  onToggleReady,
  onHealthDataSaved,
  onOrgansSaved,
  onSessionExpired,
  mode = "self",
  targetUserId,
  profile,
}: UnifiedDashboardProps) {
  const [weight, setWeight] = useState(70);
  const [weightTouched, setWeightTouched] = useState(false);
  const [weightUnknown, setWeightUnknown] = useState(false);
  const [height, setHeight] = useState(170);
  const [heightTouched, setHeightTouched] = useState(false);
  const [heightUnknown, setHeightUnknown] = useState(false);
  const [hemoglobin, setHemoglobin] = useState(14.5);
  const [hemoglobinTouched, setHemoglobinTouched] = useState(false);
  const [hemoglobinUnknown, setHemoglobinUnknown] = useState(false);
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [glucose, setGlucose] = useState(95);
  const [glucoseTouched, setGlucoseTouched] = useState(false);
  const [glucoseUnknown, setGlucoseUnknown] = useState(false);
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["Dust"]);
  const [registeredOrgans, setRegisteredOrgans] = useState<string[]>([]);
  const [blogStatus, setBlogStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyMessage, setStoryMessage] = useState("");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationState, setVerificationState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [verificationMessage, setVerificationMessage] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(profile?.profileImageUrl ?? null);
  const [imageState, setImageState] = useState<"idle" | "uploading" | "error">("idle");
  const [serviceCities, setServiceCities] = useState<UnifiedDashboardProps["profile"]["serviceCities"]>([]);
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<Array<{
    city: string;
    country: string;
    formatted_location: string;
    latitude: number;
    longitude: number;
    provider_place_id: string;
    token: string;
  }>>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityMessage, setCityMessage] = useState("");
  const hydratedRef = useRef(false);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextHealthAutosaveRef = useRef(false);
  const skipNextOrgansAutosaveRef = useRef(false);
  const sessionExpiredRef = useRef(false);
  const healthEndpoint = mode === "admin" && targetUserId ? `/api/admin/users/${targetUserId}/health` : "/api/users/me/health";
  const organsEndpoint = mode === "admin" && targetUserId ? `/api/admin/users/${targetUserId}/organs` : "/api/users/me/organs";
  const verificationEndpoint = mode === "admin" && targetUserId ? `/api/admin/users/${targetUserId}/verification-documents` : "/api/users/me/verification-documents";
  const profileEndpoint = mode === "admin" && targetUserId ? `/api/admin/users/${targetUserId}` : "/api/users/me/profile";

  const profileId = profile?.id;
  const profileHealthData = profile?.healthData;
  const profileActiveOrgans = profile?.activeOrgans;
  const profileImage = profile?.profileImageUrl;
  const profileServiceCities = profile?.serviceCities;

  useEffect(() => {
    if (!profile) return;

    const health = (profileHealthData ?? {}) as Record<string, unknown>;
    const hasExplicitTouchedFlag = (key: string) => health[key] === true;
    const hasNumericValue = (key: string) => typeof health[key] === "number";
    const resolveTouched = (key: string, fallbackValue: number, unknown: boolean) => {
      if (unknown) return true;
      if (hasExplicitTouchedFlag(`${key}Touched`)) return true;
      if (!hasNumericValue(key)) return false;
      return Number(health[key]) !== fallbackValue;
    };

    const nextWeightUnknown = Boolean(health.weightUnknown);
    const nextWeight = typeof health.weight === "number" ? health.weight : 70;
    const nextWeightTouched = resolveTouched("weight", 70, nextWeightUnknown);
    setWeight(nextWeight);
    setWeightUnknown(nextWeightUnknown);
    setWeightTouched(nextWeightTouched);

    const nextHeightUnknown = Boolean(health.heightUnknown);
    const nextHeight = typeof health.height === "number" ? health.height : 170;
    const nextHeightTouched = resolveTouched("height", 170, nextHeightUnknown);
    setHeight(nextHeight);
    setHeightUnknown(nextHeightUnknown);
    setHeightTouched(nextHeightTouched);

    const nextHemoglobinUnknown = Boolean(health.hemoglobinUnknown);
    const nextHemoglobin = typeof health.hemoglobin === "number" ? health.hemoglobin : 14.5;
    const nextHemoglobinTouched = resolveTouched("hemoglobin", 14.5, nextHemoglobinUnknown);
    setHemoglobin(nextHemoglobin);
    setHemoglobinUnknown(nextHemoglobinUnknown);
    setHemoglobinTouched(nextHemoglobinTouched);

    setIsDiabetic(Boolean(health.isDiabetic));
    const nextGlucoseUnknown = Boolean(health.glucoseUnknown);
    const nextGlucose = typeof health.glucose === "number" ? health.glucose : 95;
    const nextGlucoseTouched = resolveTouched("glucose", 95, nextGlucoseUnknown);
    setGlucose(nextGlucose);
    setGlucoseUnknown(nextGlucoseUnknown);
    setGlucoseTouched(nextGlucoseTouched);
    setSelectedVaccines(Array.isArray(health.vaccinations) ? health.vaccinations.filter((v): v is string => typeof v === "string") : []);
    setSelectedAllergies(Array.isArray(health.allergies) ? health.allergies.filter((a): a is string => typeof a === "string") : ["Dust"]);
    setRegisteredOrgans(normalizeOrganList(profileActiveOrgans ?? []));
    setProfileImageUrl(profileImage ?? null);
    setServiceCities(profileServiceCities ?? []);
    hydratedRef.current = true;
    // Prevent first autosave pass from writing pre-hydration default state.
    skipNextHealthAutosaveRef.current = true;
    skipNextOrgansAutosaveRef.current = true;
  }, [profileId, profileHealthData, profileActiveOrgans, profileImage, profileServiceCities]);

  useEffect(() => {
    if (mode !== "self") return;
    if (cityInput.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setCityLoading(true);
        const res = await fetch(`/api/location/cities?text=${encodeURIComponent(cityInput.trim())}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (cancelled) return;
        if (!res.ok || !payload.success) {
          setCitySuggestions([]);
          return;
        }
        setCitySuggestions(payload.data || []);
      } catch {
        if (!cancelled) setCitySuggestions([]);
      } finally {
        if (!cancelled) setCityLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cityInput, mode]);

  const showCityMessage = (message: string) => {
    setCityMessage(message);
    setTimeout(() => setCityMessage(""), 4000);
  };

  const addServiceCity = async (city: {
    city: string;
    country: string;
    formatted_location: string;
    latitude: number;
    longitude: number;
    provider_place_id: string;
    token: string;
  }) => {
    try {
      const res = await fetch("/api/users/me/service-cities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(city),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        showCityMessage(payload.message || "Failed to add city.");
        return;
      }
      setServiceCities(payload.data || []);
      setCityInput("");
      setCitySuggestions([]);
    } catch {
      showCityMessage("Failed to add city.");
    }
  };

  const removeServiceCity = async (cityId: string, canRemove: boolean, remainingDays?: number) => {
    if (!canRemove) {
      showCityMessage(`You can remove city after ${remainingDays ?? 0} day(s).`);
      return;
    }
    try {
      const res = await fetch(`/api/users/me/service-cities/${cityId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        showCityMessage(payload.message || "Failed to remove city.");
        return;
      }
      setServiceCities(payload.data || []);
    } catch {
      showCityMessage("Failed to remove city.");
    }
  };

  const persistHealth = async () => {
    try {
      setSaveState("saving");
      const res = await fetch(healthEndpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weightTouched && !weightUnknown ? weight : null,
          weightTouched,
          weightUnknown,
          height: heightTouched && !heightUnknown ? height : null,
          heightTouched,
          heightUnknown,
          hemoglobin: hemoglobinTouched && !hemoglobinUnknown ? hemoglobin : null,
          hemoglobinTouched,
          hemoglobinUnknown,
          isDiabetic,
          glucose: glucoseTouched && !glucoseUnknown ? glucose : null,
          glucoseTouched,
          glucoseUnknown,
          vaccinations: selectedVaccines,
          allergies: selectedAllergies,
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          sessionExpiredRef.current = true;
          onSessionExpired?.();
        }
        throw new Error("Failed to save health profile");
      }

      const payload = await res.json();
      if (payload?.success && payload.data && typeof payload.data === "object" && onHealthDataSaved) {
        onHealthDataSaved(payload.data as Record<string, unknown>);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      setSaveState("error");
    }
  };

  useEffect(() => {
    if (!hydratedRef.current || !profileId) return;
    if (sessionExpiredRef.current) return;
    if (skipNextHealthAutosaveRef.current) {
      skipNextHealthAutosaveRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void persistHealth();
    }, 700);

    return () => clearTimeout(timer);
  }, [
    weight,
    weightTouched,
    weightUnknown,
    height,
    heightTouched,
    heightUnknown,
    hemoglobin,
    hemoglobinTouched,
    hemoglobinUnknown,
    isDiabetic,
    glucose,
    glucoseTouched,
    glucoseUnknown,
    selectedVaccines,
    selectedAllergies,
    profileId,
    healthEndpoint,
  ]);

  useEffect(() => {
    if (!hydratedRef.current || !profileId) return;
    if (sessionExpiredRef.current) return;
    if (skipNextOrgansAutosaveRef.current) {
      skipNextOrgansAutosaveRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSaveState("saving");
        const res = await fetch(organsEndpoint, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organs: registeredOrgans }),
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            sessionExpiredRef.current = true;
            onSessionExpired?.();
          }
          throw new Error("Failed to save organs");
        }

        if (onOrgansSaved) {
          onOrgansSaved(registeredOrgans);
        }

        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (error) {
        setSaveState("error");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [registeredOrgans, profileId, organsEndpoint]);

  const handleBlogSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!storyTitle.trim() || !storyContent.trim()) {
      setStoryMessage("Please provide both title and description.");
      return;
    }
    setBlogStatus("submitting");
    setStoryMessage("");
    try {
      const res = await fetch("/api/users/me/blogs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: storyTitle.trim(),
          content: storyContent.trim(),
          isAnonymous,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setStoryMessage(payload.message || "Failed to submit story.");
        setBlogStatus("idle");
        return;
      }
      setBlogStatus("success");
      setStoryTitle("");
      setStoryContent("");
      setIsAnonymous(false);
      setStoryMessage("");
    } catch {
      setStoryMessage("Failed to submit story.");
      setBlogStatus("idle");
    }
  };

  const submitVerificationDocument = async () => {
    if (!verificationFile) {
      setVerificationState("error");
      setVerificationMessage("Select a file first.");
      return;
    }

    try {
      setVerificationState("uploading");
      setVerificationMessage("");

      const uploadForm = new FormData();
      uploadForm.append("file", verificationFile);
      uploadForm.append("category", "VERIFICATION");

      const uploadRes = await fetch("/api/uploads/image", {
        method: "POST",
        body: uploadForm,
        credentials: "include",
      });
      const uploadPayload = await uploadRes.json();
      if (!uploadRes.ok || !uploadPayload.success) {
        throw new Error(uploadPayload.message || "Failed to upload verification file.");
      }

      const rawUrl = uploadPayload.data?.url as string | undefined;
      if (!rawUrl) {
        throw new Error("Upload finished but URL was not returned.");
      }
      const assetUrl = rawUrl.startsWith("/") ? `${window.location.origin}${rawUrl}` : rawUrl;

      const res = await fetch(verificationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assetUrl,
          documentType: "MEDICAL_REPORT",
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Failed to submit verification request.");
      }

      setVerificationState("success");
      setVerificationMessage("Verification document submitted. Admin review is pending.");
      setVerificationFile(null);
    } catch (error) {
      setVerificationState("error");
      setVerificationMessage(error instanceof Error ? error.message : "Verification upload failed.");
    }
  };

  const handleProfileImageChange = async (file: File | null) => {
    if (!file) return;
    try {
      setImageState("uploading");
      const form = new FormData();
      form.append("file", file);
      form.append("category", "PROFILE");

      const uploadRes = await fetch("/api/uploads/image", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const uploadPayload = await uploadRes.json();
      if (!uploadRes.ok || !uploadPayload.success || !uploadPayload.data?.url) {
        throw new Error(uploadPayload.message || "Failed to upload profile image.");
      }

      const rawUrl = uploadPayload.data.url as string;
      const imageUrl = rawUrl.startsWith("/") ? `${window.location.origin}${rawUrl}` : rawUrl;

      const patchRes = await fetch(profileEndpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImageUrl: imageUrl }),
      });
      const patchPayload = await patchRes.json();
      if (!patchRes.ok || !patchPayload.success) {
        throw new Error(patchPayload.message || "Failed to save profile image.");
      }

      setProfileImageUrl(imageUrl);
      setImageState("idle");
    } catch (error) {
      setImageState("error");
      setTimeout(() => setImageState("idle"), 2000);
    }
  };

  const openProfileImagePicker = () => {
    if (imageState === "uploading") return;
    profileImageInputRef.current?.click();
  };

  const toggleVaccine = (v: string) => {
    setSelectedVaccines(prev => 
      prev.includes(v) ? prev.filter(item => item !== v) : [...prev, v]
    );
  };

  const toggleAllergy = (a: string) => {
    setSelectedAllergies(prev => 
      prev.includes(a) ? prev.filter(item => item !== a) : [...prev, a]
    );
  };

  const toggleOrgan = (o: string) => {
    setRegisteredOrgans(prev => 
      prev.includes(o) ? prev.filter(item => item !== o) : [...prev, o]
    );
  };

  return (
    <section className="dashboard-a11y mx-auto max-w-7xl px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] border border-border/10 bg-glass p-1 backdrop-blur-glass shadow-card"
      >
        <div className="p-8 md:p-12">
          {/* Header Section */}
          <div className="mb-12 flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="relative">
              <button
                type="button"
                onClick={() => void openProfileImagePicker()}
                className="group relative block h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white p-1 shadow-2xl transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={imageState === "uploading"}
                aria-label={imageState === "uploading" ? "Uploading profile photo" : "Change profile photo"}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="User"
                    className="h-full w-full rounded-[24px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-white/70 text-text/50">
                    <UserCircle2 className="h-16 w-16" />
                  </div>
                )}
                {imageState === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-black/35 text-[10px] font-black uppercase tracking-widest text-white">
                    Uploading...
                  </div>
                )}
              </button>
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleProfileImageChange(e.target.files?.[0] || null)}
              />
              <div className="pointer-events-none absolute bottom-0 right-0 flex h-11 w-11 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-white">
                {profile?.verificationStatus === "VERIFIED" ? <ShieldCheck className="h-6 w-6" /> : <Camera className="h-5 w-5" />}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-2 flex flex-col items-center gap-3 md:flex-row">
                <h1 className="text-4xl font-black tracking-tight text-text uppercase">{profile?.name ?? "Donor Profile"}</h1>
                {profile?.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-primary/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-primary ring-1 ring-primary/20">
                    Verified Elite Donor
                  </span>
                )}
              </div>
              <div className="mb-8 flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="flex items-center gap-2 text-sm font-bold text-text/60">
                  <Droplet className="h-4 w-4 text-primary" />
                  Blood Group: <span className="text-primary">{profile?.bloodGroup ?? "N/A"}</span>
                </div>
                {saveState !== "idle" && (
                  <div className="text-xs font-bold text-primary">
                    {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save failed"}
                  </div>
                )}
              </div>
              {mode === "self" && (
                <div className="mb-8 rounded-2xl border border-border/10 bg-white/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-text/50">Manage Service Cities</p>
                    <p className="text-[10px] font-bold text-text/40">{serviceCities?.length ?? 0}/5</p>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(serviceCities || []).map((city, idx) => (
                      <span key={city.id} className="inline-flex items-center gap-2 rounded-full border border-border/10 bg-white px-3 py-1 text-xs font-semibold text-text/80">
                        {idx < 2 && <MapPin className="h-3.5 w-3.5 text-primary" />}
                        {city.city}, {city.country}
                        {city.canRemove ? (
                          <button
                            type="button"
                            onClick={() => void removeServiceCity(city.id, true)}
                            className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-black text-red-600"
                          >
                            ×
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void removeServiceCity(city.id, false, city.remainingDays)}
                            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700"
                          >
                            {city.remainingDays}d
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {(serviceCities?.length ?? 0) < 5 && (
                    <div className="relative">
                      <input
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="Add another city..."
                        className="w-full rounded-xl border border-border/10 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary/50"
                      />
                      {cityLoading && <span className="absolute right-3 top-2.5 text-[10px] font-bold text-text/40">Loading...</span>}
                      {citySuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-border/10 bg-white p-1 shadow-lg">
                          {citySuggestions.map((suggestion) => (
                            <button
                              key={suggestion.provider_place_id}
                              type="button"
                              onClick={() => void addServiceCity(suggestion)}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-text/80 hover:bg-primary/5"
                            >
                              {suggestion.city}, {suggestion.country}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {cityMessage && <p className="mt-2 text-xs font-semibold text-amber-700">{cityMessage}</p>}
                </div>
              )}

              {/* Status Switch Integrated into Header */}
              <div className="flex justify-center md:justify-start">
                <div className="flex items-center gap-4 rounded-3xl border border-border/5 bg-glass px-5 py-2.5 shadow-sm backdrop-blur-md">
                  <span className={`font-mono text-[10px] font-black uppercase tracking-[2px] ${isReady ? "text-green-600" : "text-primary"}`}>
                    Status: {isReady ? "Active" : "Inactive"}
                  </span>
                  <button 
                    onClick={() => onToggleReady(!isReady)}
                    className={`relative flex h-8 w-24 items-center rounded-full p-1 transition-all duration-500 ${
                      isReady 
                        ? "bg-green-500 shadow-card" 
                        : "bg-primary/10 ring-1 ring-primary/20"
                    }`}
                  >
                    <div className={`absolute left-3 text-[8px] font-black uppercase tracking-wider transition-opacity duration-300 ${isReady ? "opacity-100 text-white" : "opacity-0"}`}>
                      Available
                    </div>
                    <div className={`absolute right-3 text-[7px] font-black uppercase tracking-wider transition-opacity duration-300 ${!isReady ? "opacity-100 text-primary" : "opacity-0"}`}>
                      Unavailable
                    </div>
                    <motion.div 
                      animate={{ x: isReady ? 64 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                    >
                      <Power className={`h-3 w-3 ${isReady ? "text-green-500" : "text-primary"}`} />
                    </motion.div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Health Profile */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-text">Health Profile</h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Weight Slider */}
                  <div className="space-y-4 rounded-3xl bg-glass p-6 ring-1 ring-border/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Body Weight</label>
                        <span className={`text-lg font-black transition-colors ${(!weightTouched || weightUnknown) ? "text-text/20" : "text-primary"}`}>
                          {!weightTouched ? "--" : weightUnknown ? "Not set" : `${weight} kg`}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setWeightTouched(true);
                          setWeightUnknown(!weightUnknown);
                        }}
                        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${weightUnknown ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-text/5 text-text/40 hover:bg-text/10"}`}
                      >
                        Don't Know
                      </button>
                    </div>
                    <div className={weightUnknown ? "opacity-20 pointer-events-none" : !weightTouched ? "opacity-40" : ""}>
                      <input 
                        type="range" 
                        min="40" 
                        max="150" 
                        value={weight}
                        onChange={(e) => {
                          setWeightTouched(true);
                          setWeightUnknown(false);
                          setWeight(parseInt(e.target.value));
                        }}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-text/10 accent-primary"
                      />
                    </div>
                  </div>

                  {/* Hemoglobin Slider */}
                  <div className="space-y-4 rounded-3xl bg-glass p-6 ring-1 ring-border/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Hemoglobin Level</label>
                        <span className={`text-lg font-black transition-colors ${(!hemoglobinTouched || hemoglobinUnknown) ? "text-text/20" : "text-primary"}`}>
                          {!hemoglobinTouched ? "--" : hemoglobinUnknown ? "Not set" : `${hemoglobin} g/dL`}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setHemoglobinTouched(true);
                          setHemoglobinUnknown(!hemoglobinUnknown);
                        }}
                        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${hemoglobinUnknown ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-text/5 text-text/40 hover:bg-text/10"}`}
                      >
                        Don't Know
                      </button>
                    </div>
                    <div className={hemoglobinUnknown ? "opacity-20 pointer-events-none" : !hemoglobinTouched ? "opacity-40" : ""}>
                      <input 
                        type="range" 
                        min="8" 
                        max="20" 
                        step="0.1"
                        value={hemoglobin}
                        onChange={(e) => {
                          setHemoglobinTouched(true);
                          setHemoglobinUnknown(false);
                          setHemoglobin(parseFloat(e.target.value));
                        }}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-text/10 accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* User Height (Full Width) */}
                <div className="rounded-3xl bg-glass p-8 ring-2 ring-border/5 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-text uppercase tracking-tight">Body Height</h3>
                        <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Physical Metrics</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setHeightTouched(true);
                        setHeightUnknown(!heightUnknown);
                      }}
                      className={`rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest transition-all ${heightUnknown ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-text/5 text-text/40 hover:bg-text/10"}`}
                    >
                      Don't Know
                    </button>
                  </div>
                  
                  <div className={heightUnknown ? "opacity-20 pointer-events-none transition-opacity" : !heightTouched ? "opacity-40 transition-opacity" : "transition-opacity"}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text/40">Height Overview</span>
                      <span className={`text-xl font-black transition-colors ${(!heightTouched || heightUnknown) ? "text-text/20" : "text-primary"}`}>
                        {!heightTouched ? "--" : heightUnknown ? "Not set" : `${height} cm`}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="250" 
                      value={height}
                      onChange={(e) => {
                        setHeightTouched(true);
                        setHeightUnknown(false);
                        setHeight(parseInt(e.target.value));
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-text/10 accent-primary"
                    />
                  </div>
                </div>

                {/* Diabetes Toggle & Conditional Glucose */}
                <div className="rounded-3xl bg-glass p-8 ring-2 ring-border/5 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                        <Thermometer className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-text uppercase tracking-tight">Diabetes History</h3>
                        <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Medical Screening</p>
                      </div>
                    </div>
                    <div className="flex rounded-full bg-text/5 p-1.5 min-w-[160px]">
                      <button 
                        onClick={() => setIsDiabetic(false)}
                        className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${!isDiabetic ? "bg-white text-text shadow-md" : "text-text/40 hover:text-text/60"}`}
                      >
                        No
                      </button>
                      <button 
                        onClick={() => setIsDiabetic(true)}
                        className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${isDiabetic ? "bg-white text-text shadow-md" : "text-text/40 hover:text-text/60"}`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isDiabetic && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6 pt-6 border-t border-border/5">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Average Glucose Level</label>
                              <span className={`text-lg font-black transition-colors ${(!glucoseTouched || glucoseUnknown) ? "text-text/20" : "text-blue-600"}`}>
                                {!glucoseTouched ? "--" : glucoseUnknown ? "Not set" : `${glucose} mg/dL`}
                              </span>
                            </div>
                            <button 
                              onClick={() => {
                                setGlucoseTouched(true);
                                setGlucoseUnknown(!glucoseUnknown);
                              }}
                              className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${glucoseUnknown ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-text/5 text-text/40 hover:bg-text/10"}`}
                            >
                              Don't Know
                            </button>
                          </div>
                          <div className={glucoseUnknown ? "opacity-20 pointer-events-none" : !glucoseTouched ? "opacity-40" : ""}>
                            <input 
                              type="range" 
                              min="50" 
                              max="300" 
                              value={glucose}
                              onChange={(e) => {
                                setGlucoseTouched(true);
                                setGlucoseUnknown(false);
                                setGlucose(parseInt(e.target.value));
                              }}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-text/10 accent-blue-600"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Segmented Toggles for Vaccines & Allergies */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Vaccinations</label>
                    <div className="flex flex-wrap gap-2">
                      {VACCINES.map(v => (
                        <button 
                          key={v}
                          onClick={() => toggleVaccine(v)}
                          className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                            selectedVaccines.includes(v)
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "bg-white/60 text-text/60 hover:bg-white ring-1 ring-border/5"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text/40">Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGIES.map(a => (
                        <button 
                          key={a}
                          onClick={() => toggleAllergy(a)}
                          className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                            selectedAllergies.includes(a)
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "bg-white/60 text-text/60 hover:bg-white ring-1 ring-border/5"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organ Donation Registry */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <OrganIcon organ="Kidney" className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-text">Organ Registry</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {ORGANS.map(o => (
                    <button 
                      key={o.name}
                      onClick={() => toggleOrgan(o.name)}
                      className={`flex flex-col items-center justify-center gap-4 rounded-3xl border p-6 transition-all ${
                        registeredOrgans.includes(o.name)
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-600 shadow-lg shadow-purple-500/5"
                          : "border-border/5 bg-glass text-text/30 hover:bg-white"
                      }`}
                    >
                      {o.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{o.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Verification & Credentials */}
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-text">Verification</h2>
                </div>

                {/* High-end Drag & Drop Zone */}
                <div className="group relative overflow-hidden rounded-[32px] border-2 border-dashed border-border/10 bg-glass p-12 text-center transition-all hover:border-primary/40 hover:bg-white/60">
                  <div className="relative z-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Upload className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-text">Medical Credentials</h3>
                    <p className="text-xs font-medium text-text/40 leading-relaxed">
                      Drag and drop your vaccine cards or hospital registry proof here. <br />
                      Supports PNG, JPG, WEBP (Max 10MB)
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3">
                      <label className="cursor-pointer rounded-full bg-text px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary">
                        Browse Files
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {verificationFile && (
                        <p className="text-xs font-semibold text-text/70">{verificationFile.name}</p>
                      )}
                      <button
                        type="button"
                        onClick={submitVerificationDocument}
                        disabled={verificationState === "uploading" || !verificationFile}
                        className="rounded-full border border-border/20 bg-white px-6 py-2 text-[10px] font-black uppercase tracking-widest text-text transition-all hover:bg-primary hover:text-white disabled:opacity-50"
                      >
                        {verificationState === "uploading" ? "Submitting..." : "Submit Verification"}
                      </button>
                      {verificationMessage && (
                        <p className={`text-xs font-semibold ${verificationState === "error" ? "text-red-600" : "text-green-600"}`}>
                          {verificationMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                {/* Verification Status List */}
                <div className="space-y-4">
                  <VerificationItem label="Identity Verified" status={profile?.verificationStatus === "VERIFIED" ? "completed" : "pending"} />
                  <VerificationItem label="Blood Type Confirmed" status="completed" />
                  <VerificationItem label="Medical History Review" status="pending" />
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="rounded-[32px] bg-gradient-to-br from-text to-text/80 p-8 text-white shadow-2xl">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-black uppercase tracking-tight">Donor Safety</h3>
                <p className="mb-8 text-xs font-medium leading-relaxed text-white/60">
                  Your data is encrypted with SHA protocols. We only share your contact details when you've explicitly accepted a donation request.
                </p>
                <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 text-xs font-black uppercase tracking-widest transition-all hover:bg-white/20">
                  Read Safety Guidelines
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section: Share Your Journey (Blog) */}
          <div className="mt-12 space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-text">Share Your Journey</h2>
            </div>
            
            <div className="glass soft-moving-bg relative flex flex-col justify-between overflow-hidden rounded-[32px] p-8 transition-all">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-6">Share your real donor journey so others can learn and stay prepared.</p>

                {blogStatus === "success" ? (
                   <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Story Submitted for Review!</h4>
                    <p className="mt-2 text-sm text-gray-500">Once approved by the manager, it will appear in Community Stories and the main Blog page.</p>
                    <button 
                      onClick={() => {
                        setBlogStatus("idle");
                        setStoryMessage("");
                      }}
                      className="mt-6 rounded-xl bg-gray-100 px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-200"
                    >
                      Write Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBlogSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span>Title (used as blog link)</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={storyTitle}
                        onChange={(evt) => setStoryTitle(evt.target.value)}
                        className="w-full rounded-xl border border-border/10 bg-glass px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white/60 focus:ring-1 focus:ring-blue-500" 
                        placeholder="Write your story title..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Description</label>
                      <textarea 
                        required
                        value={storyContent}
                        onChange={(evt) => setStoryContent(evt.target.value)}
                        rows={5}
                        className="w-full min-h-[220px] resize-y rounded-xl border border-border/10 bg-glass px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white/60 focus:ring-1 focus:ring-blue-500 lg:min-h-[600px]" 
                        placeholder="Share your full experience..."
                      />
                    </div>
                  </form>
                )}
              </div>
              
              {blogStatus !== "success" && (
                <div className="mt-8 pt-6 border-t border-black/5">
                  <div className="mb-4 flex items-center justify-between rounded-xl bg-glass px-4 py-3 border border-border/10">
                    <div className="flex items-center gap-2">
                      <Ghost className={`h-5 w-5 transition-colors ${isAnonymous ? 'text-text' : 'text-gray-400'}`} />
                      <span className="text-sm font-bold text-text">Post Anonymously</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnonymous ? 'bg-text' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <button 
                    onClick={() => void handleBlogSubmit()}
                    disabled={blogStatus === "submitting"}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-text px-4 py-3.5 font-bold text-white transition hover:bg-gray-800 disabled:opacity-70"
                  >
                    {blogStatus === "submitting" ? "Submitting..." : "Submit for Admin Review"}
                    <Send className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                  {storyMessage && (
                    <p className="mt-3 text-center text-xs font-semibold text-red-600">{storyMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-glass p-5 ring-1 ring-border/5 transition-all hover:bg-white hover:shadow-lg">
      <div className="text-2xl font-black text-text">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-text/40">{label}</div>
    </div>
  );
}

function VerificationItem({ label, status }: { label: string; status: 'completed' | 'pending' }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-glass p-4 ring-1 ring-border/5">
      <span className="text-xs font-bold text-text/80">{label}</span>
      {status === 'completed' ? (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Verified
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500">
          <Circle className="h-4 w-4" />
          Pending
        </div>
      )}
    </div>
  );
}
