import React from "react";
import { motion } from "motion/react";
import { Home, LayoutGrid, Search, Settings, Droplet } from "lucide-react";

export default function Navbar() {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blood-red">
            <Droplet className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">HemaFlow</span>
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center gap-2">
          <NavItem icon={<Home className="h-4 w-4" />} active />
          <NavItem icon={<LayoutGrid className="h-4 w-4" />} />
          <NavItem icon={<Search className="h-4 w-4" />} />
          <NavItem icon={<Settings className="h-4 w-4" />} />
        </div>

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-blood-red px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blood-red/20 transition-all hover:bg-soft-crimson"
        >
          Register
        </motion.button>
      </motion.nav>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        active ? "bg-blood-red text-white shadow-md shadow-blood-red/20" : "text-gray-300 hover:text-white"
      }`}
    >
      {icon}
    </motion.button>
  );
}
