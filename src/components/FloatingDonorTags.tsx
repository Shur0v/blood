import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";

const donorsPool = [
  { group: "A+", name: "Imran Khan", location: "Dhaka", age: "25+" },
  { group: "B+", name: "Sara Ahmed", location: "Chittagong", age: "30+" },
  { group: "O-", name: "John Doe", location: "Sylhet", age: "22+" },
  { group: "AB+", name: "Mila Kunis", location: "Rajshahi", age: "28+" },
  { group: "A-", name: "Alex Hales", location: "Khulna", age: "35+" },
  { group: "B-", name: "David Warner", location: "Barisal", age: "27+" },
  { group: "O+", name: "Virat Kohli", location: "Rangpur", age: "32+" },
  { group: "AB-", name: "Steve Smith", location: "Mymensingh", age: "29+" },
  { group: "A+", name: "Babar Azam", location: "Comilla", age: "26+" },
  { group: "B+", name: "Kane Williamson", location: "Gazipur", age: "31+" },
  { group: "O+", name: "Rohit Sharma", location: "Dhaka", age: "34+" },
  { group: "A-", name: "Joe Root", location: "Sylhet", age: "32+" },
  { group: "B-", name: "Ben Stokes", location: "Khulna", age: "29+" },
  { group: "AB+", name: "Glenn Maxwell", location: "Chittagong", age: "33+" },
  { group: "O-", name: "Rashid Khan", location: "Rajshahi", age: "24+" },
];

export default function FloatingDonorTags() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background Decorative Elements - Centered with side fade */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[500px] w-[500px] rounded-full bg-blood-red/10 blur-[120px]" />
        <div className="absolute h-[700px] w-[700px] rounded-full bg-soft-crimson/5 blur-[160px]" />
      </div>
      
      {/* Side Fades to ensure opacity 0 on left/right */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent z-0" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent z-0" />

      <div className="container mx-auto px-4 mb-12 text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight text-gray-900 uppercase"
        >
          Realtime active donor ready to help
        </motion.h2>
        <div className="mt-2 h-1.5 w-24 bg-blood-red mx-auto rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <MarqueeRow donors={[...donorsPool].sort(() => Math.random() - 0.5)} />
        <MarqueeRow donors={[...donorsPool].sort(() => Math.random() - 0.5)} />
        <MarqueeRow donors={[...donorsPool].sort(() => Math.random() - 0.5)} />
        <MarqueeRow donors={[...donorsPool].sort(() => Math.random() - 0.5)} />
        <MarqueeRow donors={[...donorsPool].sort(() => Math.random() - 0.5)} />
      </div>
    </section>
  );
}

function MarqueeRow({ donors }: { donors: typeof donorsPool }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!rowRef.current) return;

    const row = rowRef.current;
    const totalWidth = row.scrollWidth / 2;
    const randomSpeed = gsap.utils.random(60, 100); // Slower speeds (higher duration)

    animationRef.current = gsap.to(row, {
      x: -totalWidth,
      duration: randomSpeed,
      ease: "none",
      repeat: -1,
    });

    return () => {
      animationRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => animationRef.current?.pause();
  const handleMouseLeave = () => animationRef.current?.play();

  return (
    <div className="flex overflow-hidden py-6">
      <div 
        ref={rowRef} 
        className="flex shrink-0 gap-6 px-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {/* Double the items for seamless loop */}
        {[...donors, ...donors].map((donor, index) => (
          <DonorTag key={index} {...donor} />
        ))}
      </div>
    </div>
  );
}

function DonorTag({ group, name, location, age }: any) {
  return (
    <div
      className="group flex min-w-[280px] cursor-pointer items-center gap-4 rounded-full border border-white/40 bg-white/20 p-2 pr-8 shadow-[0_4px_15px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all duration-300 hover:border-blood-red/40 hover:shadow-[0_10px_30px_rgba(193,18,31,0.12)] hover:-translate-y-1"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blood-red text-lg font-black text-white shadow-[0_6px_15px_rgba(193,18,31,0.3)]">
        {group}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-bold text-gray-900">{name}</span>
        <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <span>{location}</span>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>Age {age}</span>
        </div>
      </div>
    </div>
  );
}
