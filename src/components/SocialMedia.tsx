import React from "react";
import { motion } from "motion/react";
import { Send, Droplet, Users, Bell, ShieldCheck } from "lucide-react";

export default function SocialMedia() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-8">
        {/* Left Side: Glass Card (60%) */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass relative flex-[0.6] flex flex-col items-center justify-center rounded-[8px] p-12 text-center shadow-2xl border border-white/40 overflow-hidden"
        >
          <div className="relative z-10 w-full">
            <h2 className="mb-4 text-4xl font-black tracking-tight text-gray-900 uppercase">Join Comunity</h2>
            <p className="mx-auto mb-8 max-w-md text-gray-600 font-medium">
              Be part of our growing network of life-savers. Get instant notifications for urgent blood requirements in your area.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blood-red/10 text-blood-red">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">10k+ Members</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blood-red/10 text-blood-red">
                  <Bell className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Live Alerts</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blood-red/10 text-blood-red">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Verified Only</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-[3px]">Official Channel</span>
              <SocialIcon icon={<Send className="h-10 w-10 rotate-[-20deg]" />} label="Telegram" />
            </div>
          </div>
          
          {/* Continuous moving liquid background effect with slightly more presence */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-[8px] opacity-[0.12] bg-blood-red/5">
            <div className="liquid-bg absolute inset-0" />
          </div>
        </motion.div>

        {/* Right Side: Square Image (35%) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="flex-[0.35] aspect-square overflow-hidden rounded-[8px] shadow-2xl"
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
