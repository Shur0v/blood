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
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-3 sm:px-4">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex w-full max-w-[min(100%,680px)] items-center justify-between gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 shadow-card backdrop-blur-xl sm:gap-4 sm:px-4"
      >
        {/* Logo Section */}
        <button
          onClick={onHomeClick}
          className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-2"
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-dark">
            <Droplet className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="hidden text-sm font-bold tracking-tight text-white sm:inline">BloodNet</span>
        </button>

        {/* Navigation Icons */}
        <div className="flex min-w-0 items-center justify-center gap-1 sm:gap-2">
          <NavItem 
            icon={<Home className="h-4 w-4" />} 
            active={currentPage === "home"} 
            onClick={() => onPageChange("home")}
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
          className="flex shrink-0 items-center gap-2 rounded-full bg-primary-dark px-3 py-2 text-xs font-bold text-white shadow-lg shadow-primary-dark/20 transition-all hover:bg-primary sm:px-5"
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
    >
      {icon}
    </motion.button>
  );
}
