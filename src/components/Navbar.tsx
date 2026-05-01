import React from "react";
import { motion } from "motion/react";
import { Home, BookOpen, Activity, Droplet, User } from "lucide-react";

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onAuthClick: () => void;
  onHomeClick: () => void;
  isLoggedIn: boolean;
}

export default function Navbar({ currentPage, onPageChange, onAuthClick, onHomeClick, isLoggedIn }: NavbarProps) {
  return (
    <div className="fixed bottom-8 left-[15px] right-[15px] z-50 flex justify-center">
      <motion.nav
        className="flex max-w-full items-center gap-4 rounded-full border border-white/10 bg-black/40 px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl"
      >
        {/* Logo Section */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2 border-r border-white/10 pr-2"
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark">
            <Droplet className="h-5 w-5 fill-white text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">BloodNet</span>
        </button>

        {/* Navigation Icons */}
        <div className="flex items-center gap-2">
          <NavItem 
            icon={<Home className="h-4 w-4" />} 
            active={currentPage === "home"} 
            onClick={onHomeClick}
          />
          <NavItem 
            icon={<BookOpen className="h-4 w-4" />} 
            active={currentPage === "blog" || currentPage.startsWith("blog/")} 
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/blog";
              }
            }}
          />
          <NavItem 
            icon={<Activity className="h-4 w-4" />} 
            active={currentPage === "organ"} 
            onClick={() => onPageChange("organ")}
          />
        </div>

        {/* Register/Profile Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAuthClick}
          className="flex items-center gap-2 rounded-full bg-primary-dark px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary-dark/20 transition-all hover:bg-primary"
        >
          {isLoggedIn ? (
            <>
              <User className="h-3.5 w-3.5" />
              Profile
            </>
          ) : (
            "Register"
          )}
        </motion.button>
      </motion.nav>
    </div>
  );
}

function NavItem({ icon, active = false, onClick }: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        active ? "bg-primary-dark text-white shadow-md shadow-primary-dark/20" : "text-gray-300 hover:text-white"
      }`}
      type="button"
    >
      {icon}
    </motion.button>
  );
}
