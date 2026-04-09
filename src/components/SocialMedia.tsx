import React from "react";
import { motion } from "motion/react";
import { Send, Droplet, Users, Bell, ShieldCheck } from "lucide-react";

export default function SocialMedia() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
        {/* Left Side: Glass Card (approx 65%) */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass relative flex-[1.8] flex flex-col items-center justify-center rounded-[8px] p-8 text-center shadow-2xl border border-white/40 overflow-hidden"
        >
          <div className="relative z-10 w-full">
            <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 uppercase">JOIN THE COMMUNITY</h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-gray-600 font-medium leading-relaxed">
              Be part of our growing network of life-savers. Get instant notifications for urgent blood requirements in your area.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <FeatureCard 
                icon={<Users className="h-5 w-5" />} 
                title="10K+ Members" 
                desc="Join a growing network" 
              />
              <FeatureCard 
                icon={<Bell className="h-5 w-5" />} 
                title="Live Alerts" 
                desc="Get instant notifications" 
              />
              <FeatureCard 
                icon={<ShieldCheck className="h-5 w-5" />} 
                title="Verified Only" 
                desc="Safe & trusted donors" 
              />
            </div>

            {/* Main CTA Button */}
            <div className="flex flex-col items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#F23030] to-[#C1121F] px-8 py-4 text-base font-bold text-white shadow-[0_8px_30px_rgba(193,18,31,0.25)] transition-all hover:shadow-[0_12px_40px_rgba(193,18,31,0.35)]"
              >
                <Send className="h-5 w-5 rotate-[-20deg] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                Join Now on Telegram
              </motion.button>

              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-semibold text-gray-500">
                  <span className="opacity-60">Trusted by 10,000+ donors • Updated every minute</span>
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-white object-cover"
                        src={`https://i.pravatar.cc/100?u=${i + 10}`}
                        alt="User"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/50 px-2 py-0.5 backdrop-blur-md">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-gray-700">
                      <span className="text-red-600">12</span> active requests in your area
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Continuous moving liquid background effect - Enhanced for Apple Glass look */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-[8px] opacity-[0.15]">
            <div className="liquid-bg absolute inset-0 scale-150 blur-3xl" />
          </div>
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white/40 to-white/10" />
        </motion.div>

        {/* Right Side: Image (approx 35%) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="flex-[1] overflow-hidden rounded-[8px] shadow-2xl"
        >
          <img 
            src="https://blog.hocking.edu/hubfs/Images/Stock%20images/blood-donation_custom-4a7ebcf0e0864084e9035d1ddc48b84d884b12e8-s900-c85.jpg" 
            alt="Community" 
            className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/60 bg-white/40 p-3 shadow-sm backdrop-blur-md transition-all hover:bg-white/60 hover:shadow-md">
      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
        {icon}
      </div>
      <h4 className="mb-0.5 text-xs font-bold text-gray-900">{title}</h4>
      <p className="text-[9px] font-medium text-gray-500">{desc}</p>
    </div>
  );
}

function SocialIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.2, rotate: 10, backgroundColor: "#C1121F", color: "#FFFFFF" }}
      whileTap={{ scale: 0.9 }}
      className="glass flex h-20 w-20 items-center justify-center rounded-[8px] text-gray-700 shadow-xl transition-all hover:shadow-blood-red/30"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

export function Footer() {
  return (
    <footer className="bg-black py-24 text-gray-400">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blood-red">
                <Droplet className="h-7 w-7 text-white fill-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-white">HemaFlow</span>
            </div>
            <p className="max-w-md text-lg leading-relaxed">
              A premium blood donation platform dedicated to connecting donors and recipients with a modern, futuristic approach to healthcare.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-xl font-bold text-white">Quick Links</h4>
            <ul className="flex flex-col gap-4 text-lg">
              <li><a href="#" className="transition-colors hover:text-white">About Us</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Contact</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xl font-bold text-white">Contact Info</h4>
            <ul className="flex flex-col gap-4 text-lg">
              <li>info@hemaflow.com</li>
              <li>+880 1234 567 890</li>
              <li>Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>

        <div className="mt-24 border-t border-white/10 pt-12 text-center text-sm">
          <p>&copy; 2026 HemaFlow. All rights reserved. Designed with premium glassmorphism.</p>
        </div>
      </div>
    </footer>
  );
}
