import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { Phone, MapPin, Search, X, Heart, Brain, Eye, Activity, Stethoscope, Syringe, Thermometer, Microscope } from "lucide-react";
import { gsap } from "gsap";
import DonorModal from "./DonorModal";

const organs = [
  { name: "Heart", icon: <Heart className="h-6 w-6" /> },
  { name: "Kidney", icon: <Activity className="h-6 w-6" /> },
  { name: "Liver", icon: <Syringe className="h-6 w-6" /> },
  { name: "Lungs", icon: <Stethoscope className="h-6 w-6" /> },
  { name: "Brain", icon: <Brain className="h-6 w-6" /> },
  { name: "Eye", icon: <Eye className="h-6 w-6" /> },
  { name: "Pancreas", icon: <Thermometer className="h-6 w-6" /> },
  { name: "Intestine", icon: <Microscope className="h-6 w-6" /> },
];

const bloodGroups = ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"];

interface Donor {
  name: string;
  phone: string;
  organ: string;
  bloodGroup: string;
  location: string;
}

const organDonors: Donor[] = [
  { name: "Imran Khan", phone: "+880 1712 345678", organ: "Heart", bloodGroup: "A+", location: "Dhaka, BD" },
  { name: "Sara Ahmed", phone: "+880 1812 987654", organ: "Kidney", bloodGroup: "B+", location: "Chittagong, BD" },
  { name: "John Doe", phone: "+880 1912 112233", organ: "Liver", bloodGroup: "O+", location: "Sylhet, BD" },
  { name: "Mila Kunis", phone: "+880 1612 445566", organ: "Lungs", bloodGroup: "AB+", location: "Rajshahi, BD" },
  { name: "Alex Hales", phone: "+880 1512 778899", organ: "Brain", bloodGroup: "A-", location: "Khulna, BD" },
  { name: "David Warner", phone: "+880 1412 009988", organ: "Eye", bloodGroup: "B-", location: "Barisal, BD" },
  { name: "Virat Kohli", phone: "+880 1312 334455", organ: "Pancreas", bloodGroup: "O-", location: "Rangpur, BD" },
  { name: "Steve Smith", phone: "+880 1212 667788", organ: "Intestine", bloodGroup: "AB-", location: "Mymensingh, BD" },
  { name: "Babar Azam", phone: "+880 1112 990011", organ: "Heart", bloodGroup: "A+", location: "Comilla, BD" },
  { name: "Kane Williamson", phone: "+880 1012 223344", organ: "Kidney", bloodGroup: "B+", location: "Gazipur, BD" },
];

export default function OrganHero() {
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null);
  const [activeBloodGroup, setActiveBloodGroup] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  
  const controlsWrapperRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, 842, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [count]);

  useEffect(() => {
    if (isSearchOpen) {
      gsap.to(controlsWrapperRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        display: "none",
        ease: "power2.inOut"
      });
      
      gsap.fromTo(searchContainerRef.current, 
        { opacity: 0, scaleX: 0.8, display: "none" },
        { 
          opacity: 1, 
          scaleX: 1, 
          display: "flex", 
          duration: 0.5, 
          ease: "expo.out",
          onComplete: () => searchInputRef.current?.focus()
        }
      );
    } else {
      gsap.to(searchContainerRef.current, {
        opacity: 0,
        scaleX: 0.8,
        duration: 0.3,
        display: "none",
        ease: "power2.inOut"
      });
      
      gsap.fromTo(controlsWrapperRef.current,
        { opacity: 0, y: 10, display: "none" },
        { 
          opacity: 1, 
          y: 0, 
          display: "flex", 
          duration: 0.5, 
          ease: "expo.out" 
        }
      );
    }
  }, [isSearchOpen]);

  const filteredDonors = organDonors.filter(donor => {
    const matchesOrgan = activeOrgan ? donor.organ === activeOrgan : true;
    const matchesBlood = activeBloodGroup ? donor.bloodGroup === activeBloodGroup : true;
    const matchesSearch = searchQuery 
      ? donor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesOrgan && matchesBlood && matchesSearch;
  });

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-32">
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blood-red/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-soft-crimson/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-7xl">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass relative mx-auto mb-12 w-full max-w-4xl overflow-hidden rounded-[8px] p-10 text-center shadow-2xl"
        >
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-10 inline-flex flex-col items-center rounded-[8px] bg-gray-900 p-1.5 shadow-2xl"
            >
              <div className="flex min-w-[160px] items-center justify-center rounded-[6px] bg-white py-4">
                <motion.span className="text-5xl font-black tabular-nums tracking-tighter text-gray-900">
                  {rounded}
                </motion.span>
              </div>
              <div className="px-4 py-2">
                <span className="text-base font-bold lowercase tracking-[2px] text-white">
                  organ donors
                </span>
              </div>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Give the Gift of <span className="text-blood-red">Life</span>.
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-500">
              Connect with organ donors instantly. Our platform facilitates the matching process for life-saving transplants with utmost care and security.
            </p>

            {/* Two-Line Filter System */}
            <div className="relative mx-auto flex flex-col gap-4 w-full max-w-5xl">
              {/* Line 1: Organ Filters */}
              <div className="flex w-full items-center gap-1.5 md:gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveOrgan(null)}
                  className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                    activeOrgan === null
                      ? "bg-blood-red text-white shadow-lg shadow-blood-red/30"
                      : "glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                  }`}
                >
                  All
                </motion.button>
                {organs.map((organ) => (
                  <motion.button
                    key={organ.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveOrgan(organ.name)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                      activeOrgan === organ.name
                        ? "bg-blood-red text-white shadow-lg shadow-blood-red/30"
                        : "glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                    }`}
                  >
                    {organ.name}
                  </motion.button>
                ))}
              </div>

              {/* Line 2: Blood Group Filters + Search Trigger */}
              <div className="relative flex h-14 w-full items-center gap-2">
                <div 
                  ref={controlsWrapperRef}
                  className="flex w-full items-center gap-2"
                >
                  {/* Blood Group Filters (90%) */}
                  <div className="flex w-[90%] items-center gap-1.5 md:gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveBloodGroup(null)}
                      className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                        activeBloodGroup === null
                          ? "bg-blood-red text-white shadow-lg shadow-blood-red/30"
                          : "glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                      }`}
                    >
                      All
                    </motion.button>
                    {bloodGroups.map((group) => (
                      <motion.button
                        key={group}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveBloodGroup(group)}
                        className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                          activeBloodGroup === group
                            ? "bg-blood-red text-white shadow-lg shadow-blood-red/30"
                            : "glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                        }`}
                      >
                        {group}
                      </motion.button>
                    ))}
                  </div>

                  {/* Search Trigger (10%) */}
                  <div className="flex w-[10%] items-center justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsSearchOpen(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-[8px] glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                    >
                      <Search className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Expandable Search Input */}
                <div 
                  ref={searchContainerRef}
                  className="absolute inset-0 z-20 hidden items-center gap-2 px-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input 
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search cities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 w-full rounded-[8px] border-none bg-white/80 pl-12 pr-4 font-medium text-gray-900 shadow-xl outline-none ring-2 ring-blood-red/20 backdrop-blur-md focus:ring-blood-red"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-blood-red text-white shadow-lg shadow-blood-red/30"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredDonors.map((donor, index) => (
            <motion.div
              key={`${donor.name}-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedDonor({ ...donor, group: donor.organ })}
              whileHover={{ 
                y: -5, 
                transition: { type: "spring", stiffness: 400, damping: 15 }
              }}
              className="group relative flex items-center gap-3 cursor-pointer overflow-hidden rounded-[8px] border border-white/40 bg-white/20 p-2 pr-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-300 hover:border-blood-red/40 hover:shadow-[0_10px_30px_rgba(193,18,31,0.12)]"
            >
              <div className="absolute inset-0 rounded-[8px] ring-1 ring-inset ring-white/50" />
              
              <div className="relative z-10 flex w-full items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-blood-red text-lg font-black text-white shadow-[0_6px_15px_rgba(193,18,31,0.3)]">
                  {organs.find(o => o.name === donor.organ)?.icon || <Activity className="h-6 w-6" />}
                </div>

                <div className="ml-3 flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-sm font-bold tracking-tight text-gray-900">{donor.name}</h3>
                    <span className="text-[10px] font-black text-blood-red bg-blood-red/10 px-1.5 py-0.5 rounded ml-2">{donor.bloodGroup}</span>
                  </div>
                  <div className="mt-0.5 flex flex-col text-[10px] font-medium text-gray-600">
                    <span className="truncate">{donor.phone}</span>
                    <span className="truncate opacity-70">{donor.location}</span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-full -left-full h-[200%] w-[200%] rotate-45 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 transition-all duration-700 group-hover:top-[-50%] group-hover:left-[-50%] group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>

      <DonorModal 
        donor={selectedDonor} 
        onClose={() => setSelectedDonor(null)} 
      />
    </section>
  );
}
