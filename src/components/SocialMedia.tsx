import React from "react";
import { motion } from "motion/react";
import { Facebook, Instagram, Twitter, Linkedin, Droplet } from "lucide-react";

export default function SocialMedia() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h2 className="mb-12 text-4xl font-bold tracking-tight text-white">Find Us On</h2>
      <div className="flex flex-wrap justify-center gap-8">
        <SocialIcon icon={<Facebook className="h-8 w-8" />} label="Facebook" />
        <SocialIcon icon={<Instagram className="h-8 w-8" />} label="Instagram" />
        <SocialIcon icon={<Twitter className="h-8 w-8" />} label="Twitter" />
        <SocialIcon icon={<Linkedin className="h-8 w-8" />} label="LinkedIn" />
      </div>
    </section>
  );
}

function SocialIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.2, rotate: 10, backgroundColor: "#C1121F", color: "#FFFFFF" }}
      whileTap={{ scale: 0.9 }}
      className="glass flex h-20 w-20 items-center justify-center rounded-[8px] text-gray-300 shadow-xl transition-all hover:shadow-blood-red/30"
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
