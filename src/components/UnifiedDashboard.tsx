import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Activity, 
  Heart, 
  Brain, 
  Eye, 
  Stethoscope, 
  Syringe, 
  Thermometer, 
  Microscope,
  CheckCircle2,
  Circle,
  MapPin,
  Droplet,
  Power,
  Upload,
  ChevronRight,
  Info
} from "lucide-react";

const VACCINES = ["COVID-19", "HBV", "BCG", "Influenza", "MMR", "Polio", "Tetanus"];
const ALLERGIES = ["Peanuts", "Penicillin", "Latex", "Pollen", "Dust", "None"];
const ORGANS = [
  { name: "Heart", icon: <Heart className="h-6 w-6" /> },
  { name: "Kidney", icon: <Activity className="h-6 w-6" /> },
  { name: "Liver", icon: <Stethoscope className="h-6 w-6" /> },
  { name: "Eyes", icon: <Eye className="h-6 w-6" /> },
  { name: "Lungs", icon: <Thermometer className="h-6 w-6" /> },
  { name: "Pancreas", icon: <Brain className="h-6 w-6" /> }
];

interface UnifiedDashboardProps {
  isReady: boolean;
  onToggleReady: (ready: boolean) => void;
}

export default function UnifiedDashboard({ isReady, onToggleReady }: UnifiedDashboardProps) {
  const [weight, setWeight] = useState(70);
  const [weightUnknown, setWeightUnknown] = useState(false);
  const [hemoglobin, setHemoglobin] = useState(14.5);
  const [hemoglobinUnknown, setHemoglobinUnknown] = useState(false);
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [glucose, setGlucose] = useState(95);
  const [glucoseUnknown, setGlucoseUnknown] = useState(false);
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["Dust"]);
  const [registeredOrgans, setRegisteredOrgans] = useState<string[]>([]);

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
    <section className="mx-auto max-w-7xl px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] border border-[#101828]/10 bg-white/40 p-1 backdrop-blur-[30px] shadow-[0_32px_64px_-12px_rgba(16,24,40,0.14)]"
      >
        <div className="p-8 md:p-12">
          {/* Header Section */}
          <div className="mb-12 flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="relative">
              <div className="h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white p-1 shadow-2xl">
                <img 
                  src="https://i.pravatar.cc/150?u=hemaflow_user" 
                  alt="User" 
                  className="h-full w-full rounded-[24px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-red text-white shadow-xl ring-4 ring-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-2 flex flex-col items-center gap-3 md:flex-row">
                <h1 className="text-4xl font-black tracking-tight text-[#101828] uppercase">Alex Shurov</h1>
                <span className="rounded-full bg-accent-red/10 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-accent-red ring-1 ring-accent-red/20">
                  Verified Elite Donor
                </span>
              </div>
              <div className="mb-8 flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="flex items-center gap-2 text-sm font-bold text-[#101828]/60">
                  <MapPin className="h-4 w-4 text-accent-red" />
                  Dhaka, Bangladesh
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#101828]/60">
                  <Droplet className="h-4 w-4 text-accent-red" />
                  Blood Group: <span className="text-accent-red">AB+</span>
                </div>
              </div>

              {/* Status Switch Integrated into Header */}
              <div className="flex justify-center md:justify-start">
                <div className="flex items-center gap-4 rounded-3xl border border-[#101828]/5 bg-white/40 px-5 py-2.5 shadow-sm backdrop-blur-md">
                  <span className={`font-mono text-[10px] font-black uppercase tracking-[2px] ${isReady ? "text-green-600" : "text-accent-red"}`}>
                    Status: {isReady ? "Active" : "Inactive"}
                  </span>
                  <button 
                    onClick={() => onToggleReady(!isReady)}
                    className={`relative flex h-8 w-24 items-center rounded-full p-1 transition-all duration-500 ${
                      isReady 
                        ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                        : "bg-accent-red/10 ring-1 ring-accent-red/20"
                    }`}
                  >
                    <div className={`absolute left-3 text-[8px] font-black uppercase tracking-wider transition-opacity duration-300 ${isReady ? "opacity-100 text-white" : "opacity-0"}`}>
                      Available
                    </div>
                    <div className={`absolute right-3 text-[7px] font-black uppercase tracking-wider transition-opacity duration-300 ${!isReady ? "opacity-100 text-accent-red" : "opacity-0"}`}>
                      Unavailable
                    </div>
                    <motion.div 
                      animate={{ x: isReady ? 64 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                    >
                      <Power className={`h-3 w-3 ${isReady ? "text-green-500" : "text-accent-red"}`} />
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-red/10 text-accent-red">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-[#101828]">Health Profile</h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Weight Slider */}
                  <div className="space-y-4 rounded-3xl bg-white/40 p-6 ring-1 ring-[#101828]/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Body Weight</label>
                        <span className={`text-lg font-black transition-colors ${weightUnknown ? "text-[#101828]/20" : "text-accent-red"}`}>{weight} kg</span>
                      </div>
                      <button 
                        onClick={() => setWeightUnknown(!weightUnknown)}
                        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${weightUnknown ? "bg-accent-red text-white shadow-lg shadow-accent-red/20" : "bg-[#101828]/5 text-[#101828]/40 hover:bg-[#101828]/10"}`}
                      >
                        Don't Know
                      </button>
                    </div>
                    <div className={weightUnknown ? "opacity-20 pointer-events-none" : ""}>
                      <input 
                        type="range" 
                        min="40" 
                        max="150" 
                        value={weight}
                        onChange={(e) => setWeight(parseInt(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#101828]/10 accent-accent-red"
                      />
                    </div>
                  </div>

                  {/* Hemoglobin Slider */}
                  <div className="space-y-4 rounded-3xl bg-white/40 p-6 ring-1 ring-[#101828]/5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Hemoglobin Level</label>
                        <span className={`text-lg font-black transition-colors ${hemoglobinUnknown ? "text-[#101828]/20" : "text-accent-red"}`}>{hemoglobin} g/dL</span>
                      </div>
                      <button 
                        onClick={() => setHemoglobinUnknown(!hemoglobinUnknown)}
                        className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${hemoglobinUnknown ? "bg-accent-red text-white shadow-lg shadow-accent-red/20" : "bg-[#101828]/5 text-[#101828]/40 hover:bg-[#101828]/10"}`}
                      >
                        Don't Know
                      </button>
                    </div>
                    <div className={hemoglobinUnknown ? "opacity-20 pointer-events-none" : ""}>
                      <input 
                        type="range" 
                        min="8" 
                        max="20" 
                        step="0.1"
                        value={hemoglobin}
                        onChange={(e) => setHemoglobin(parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#101828]/10 accent-accent-red"
                      />
                    </div>
                  </div>
                </div>

                {/* Diabetes Toggle & Conditional Glucose */}
                <div className="rounded-3xl bg-white/40 p-8 ring-2 ring-[#101828]/5 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                        <Thermometer className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#101828] uppercase tracking-tight">Diabetes History</h3>
                        <p className="text-[10px] font-bold text-[#101828]/40 uppercase tracking-widest">Medical Screening</p>
                      </div>
                    </div>
                    <div className="flex rounded-full bg-[#101828]/5 p-1.5 min-w-[160px]">
                      <button 
                        onClick={() => setIsDiabetic(false)}
                        className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${!isDiabetic ? "bg-white text-[#101828] shadow-md" : "text-[#101828]/40 hover:text-[#101828]/60"}`}
                      >
                        No
                      </button>
                      <button 
                        onClick={() => setIsDiabetic(true)}
                        className={`flex-1 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${isDiabetic ? "bg-white text-[#101828] shadow-md" : "text-[#101828]/40 hover:text-[#101828]/60"}`}
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
                        <div className="space-y-6 pt-6 border-t border-[#101828]/5">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Average Glucose Level</label>
                              <span className={`text-lg font-black transition-colors ${glucoseUnknown ? "text-[#101828]/20" : "text-blue-600"}`}>{glucose} mg/dL</span>
                            </div>
                            <button 
                              onClick={() => setGlucoseUnknown(!glucoseUnknown)}
                              className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${glucoseUnknown ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#101828]/5 text-[#101828]/40 hover:bg-[#101828]/10"}`}
                            >
                              Don't Know
                            </button>
                          </div>
                          <div className={glucoseUnknown ? "opacity-20 pointer-events-none" : ""}>
                            <input 
                              type="range" 
                              min="50" 
                              max="300" 
                              value={glucose}
                              onChange={(e) => setGlucose(parseInt(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#101828]/10 accent-blue-600"
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Vaccinations</label>
                    <div className="flex flex-wrap gap-2">
                      {VACCINES.map(v => (
                        <button 
                          key={v}
                          onClick={() => toggleVaccine(v)}
                          className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                            selectedVaccines.includes(v)
                              ? "bg-accent-red text-white shadow-lg shadow-accent-red/20"
                              : "bg-white/60 text-[#101828]/60 hover:bg-white ring-1 ring-[#101828]/5"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGIES.map(a => (
                        <button 
                          key={a}
                          onClick={() => toggleAllergy(a)}
                          className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                            selectedAllergies.includes(a)
                              ? "bg-accent-red text-white shadow-lg shadow-accent-red/20"
                              : "bg-white/60 text-[#101828]/60 hover:bg-white ring-1 ring-[#101828]/5"
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
                    <Heart className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-[#101828]">Organ Registry</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {ORGANS.map(o => (
                    <button 
                      key={o.name}
                      onClick={() => toggleOrgan(o.name)}
                      className={`flex flex-col items-center justify-center gap-4 rounded-3xl border p-6 transition-all ${
                        registeredOrgans.includes(o.name)
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-600 shadow-lg shadow-purple-500/5"
                          : "border-[#101828]/5 bg-white/40 text-[#101828]/30 hover:bg-white"
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-red/10 text-accent-red">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-[#101828]">Verification</h2>
                </div>

                {/* High-end Drag & Drop Zone */}
                <div className="group relative cursor-pointer overflow-hidden rounded-[32px] border-2 border-dashed border-[#101828]/10 bg-white/40 p-12 text-center transition-all hover:border-accent-red/40 hover:bg-white/60">
                  <div className="relative z-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-red/10 text-accent-red transition-transform group-hover:scale-110">
                      <Upload className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-[#101828]">Medical Credentials</h3>
                    <p className="text-xs font-medium text-[#101828]/40 leading-relaxed">
                      Drag and drop your vaccine cards or hospital registry proof here. <br />
                      Supports PDF, PNG, JPG (Max 5MB)
                    </p>
                    <button className="mt-8 rounded-full bg-[#101828] px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-accent-red">
                      Browse Files
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent-red/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                {/* Verification Status List */}
                <div className="space-y-4">
                  <VerificationItem label="Identity Verified" status="completed" />
                  <VerificationItem label="Blood Type Confirmed" status="completed" />
                  <VerificationItem label="Medical History Review" status="pending" />
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="rounded-[32px] bg-gradient-to-br from-[#101828] to-[#1c2a44] p-8 text-white shadow-2xl">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Info className="h-6 w-6 text-accent-red" />
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
        </div>
      </motion.div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/40 p-5 ring-1 ring-[#101828]/5 transition-all hover:bg-white hover:shadow-lg">
      <div className="text-2xl font-black text-[#101828]">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-[#101828]/40">{label}</div>
    </div>
  );
}

function VerificationItem({ label, status }: { label: string; status: 'completed' | 'pending' }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/40 p-4 ring-1 ring-[#101828]/5">
      <span className="text-xs font-bold text-[#101828]/80">{label}</span>
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
