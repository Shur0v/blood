import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { Phone, MapPin, User, Search, X } from "lucide-react";
import { gsap } from "gsap";

const bloodGroups = ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"];

const donors = [
  { name: "Imran Khan", phone: "+880 1712 345678", group: "A+", location: "Dhaka, BD" },
  { name: "Sara Ahmed", phone: "+880 1812 987654", group: "B+", location: "Chittagong, BD" },
  { name: "John Doe", phone: "+880 1912 112233", group: "O+", location: "Sylhet, BD" },
  { name: "Mila Kunis", phone: "+880 1612 445566", group: "AB+", location: "Rajshahi, BD" },
  { name: "Alex Hales", phone: "+880 1512 778899", group: "A-", location: "Khulna, BD" },
  { name: "David Warner", phone: "+880 1412 009988", group: "B-", location: "Barisal, BD" },
  { name: "Virat Kohli", phone: "+880 1312 334455", group: "O-", location: "Rangpur, BD" },
  { name: "Steve Smith", phone: "+880 1212 667788", group: "AB-", location: "Mymensingh, BD" },
  { name: "Babar Azam", phone: "+880 1112 990011", group: "A+", location: "Comilla, BD" },
  { name: "Kane Williamson", phone: "+880 1012 223344", group: "B+", location: "Gazipur, BD" },
  { name: "Joe Root", phone: "+880 1722 556677", group: "O+", location: "Narayanganj, BD" },
  { name: "Ben Stokes", phone: "+880 1822 889900", group: "AB+", location: "Savr, BD" },
  { name: "Pat Cummins", phone: "+880 1922 112244", group: "A-", location: "Tongi, BD" },
  { name: "Rashid Khan", phone: "+880 1622 334455", group: "B-", location: "Bogra, BD" },
  { name: "Quinton de Kock", phone: "+880 1522 667788", group: "O-", location: "Pabna, BD" },
  { name: "Jos Buttler", phone: "+880 1422 990011", group: "AB-", location: "Jessore, BD" },
];

// Moving Card Component for the Marquee
const MovingCard = ({ donor, speed, rowTop, index }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const cardWidth = 260;
    // Initial spread across the screen
    const startX = window.innerWidth + (index * 350);
    
    const animate = (fromX: number) => {
      const targetX = -cardWidth - 100;
      const distance = fromX - targetX;
      // Calculate duration based on distance to maintain constant speed
      const duration = distance / speed;

      tweenRef.current = gsap.fromTo(card,
        { x: fromX },
        {
          x: targetX,
          duration: duration,
          ease: "none",
          onComplete: () => animate(window.innerWidth + 100)
        }
      );
    };

    animate(startX);

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [speed, index]);

  return (
    <div
      ref={cardRef}
      style={{ top: rowTop }}
      onMouseEnter={() => tweenRef.current?.pause()}
      onMouseLeave={() => tweenRef.current?.play()}
      className="absolute flex items-center bg-white/40 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg border border-white/60 min-w-[240px] cursor-pointer select-none transition-shadow hover:shadow-blood-red/20"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blood-red text-sm font-bold text-white shadow-md">
        {donor.group}
      </div>
      <div className="ml-3 flex flex-col overflow-hidden">
        <h3 className="truncate text-sm font-bold text-gray-900">{donor.name}</h3>
        <p className="truncate text-[10px] font-medium text-gray-600">{donor.location} — 25+</p>
      </div>
    </div>
  );
};

export default function Hero() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const controlsWrapperRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, 2509, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [count]);

  // GSAP Animation for Search Expansion
  useEffect(() => {
    if (isSearchOpen) {
      // Hide main controls and show search with GSAP
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
      // Show main controls and hide search with GSAP
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

  const filteredDonors = donors.filter(donor => {
    const matchesGroup = activeGroup ? donor.group === activeGroup : true;
    const matchesSearch = searchQuery 
      ? donor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-32">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blood-red/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-soft-crimson/5 blur-[120px]" />

      {/* Hero Content Wrapper */}
      <div className="relative z-10 w-full max-w-7xl">
        {/* Main Hero Card */}
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
                  active donor
                </span>
              </div>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Every Drop <span className="text-blood-red">Counts</span>.
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-500">
              Join our premium community of life-savers. Connect with donors instantly and manage blood stocks with our futuristic medical dashboard.
            </p>

            {/* Filter Tabs & Search Row */}
            <div className="relative mx-auto flex h-14 w-full max-w-5xl items-center gap-2">
              {/* Main Controls (90% Filters + 10% Search Trigger) */}
              <div 
                ref={controlsWrapperRef}
                className="flex w-full items-center gap-2"
              >
                {/* Filter Buttons Container (90% Width) */}
                <div className="flex w-[90%] items-center gap-1.5 md:gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveGroup(null)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                      activeGroup === null
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
                      onClick={() => setActiveGroup(group)}
                      className={`flex h-12 flex-1 items-center justify-center rounded-[8px] text-[10px] font-bold transition-all sm:text-xs md:text-sm ${
                        activeGroup === group
                          ? "bg-blood-red text-white shadow-lg shadow-blood-red/30"
                          : "glass text-gray-600 hover:border-blood-red/30 hover:text-blood-red"
                      }`}
                    >
                      {group}
                    </motion.button>
                  ))}
                </div>

                {/* Search Trigger Button (10% Width) */}
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

              {/* Expandable Search Input Container (GSAP Controlled) */}
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

          {/* Liquid Background Effect */}
          <div className="absolute inset-0 -z-10 opacity-[0.03]">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        {/* Donor Marquee Section (5 Rows) */}
        <div className="relative mt-12 h-[460px] w-full overflow-hidden">
          {[0, 1, 2, 3, 4].map((rowIdx) => {
            const rowSpeed = 40 + Math.random() * 40;
            const rowTop = rowIdx * 90;
            
            // Assign 5 cards per row, cycling through donors
            return [0, 1, 2, 3, 4].map((cardIdx) => {
              const donorIdx = (rowIdx * 5 + cardIdx) % donors.length;
              // Add a slight random variance to each card's speed for "random" feel
              const cardSpeed = rowSpeed + (Math.random() * 10 - 5);
              
              return (
                <MovingCard 
                  key={`${rowIdx}-${cardIdx}`}
                  donor={donors[donorIdx]}
                  speed={cardSpeed}
                  rowTop={rowTop}
                  index={cardIdx}
                />
              );
            });
          })}
        </div>
      </div>
    </section>
  );
}
