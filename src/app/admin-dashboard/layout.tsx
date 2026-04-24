'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, AlertTriangle, UserMinus, Globe, 
  Droplet, Heart, Image as ImageIcon, PenTool, MousePointerClick, 
  Map, Shield, Menu, X, Bell, Search, Settings, FileText, Palette
} from 'lucide-react';
import { useEffect } from 'react';

const MENU_ITEMS = [
  { name: 'Dashboard Overview', href: '/admin-dashboard', icon: LayoutDashboard },
  { name: 'All User List', href: '/admin-dashboard/users', icon: Users },
  { name: 'Reports', href: '/admin-dashboard/reports', icon: AlertTriangle },
  { name: 'Patient Aid Requests', href: '/admin-dashboard/financial-requests', icon: FileText },
  { name: 'Inactive Donors', href: '/admin-dashboard/inactive-donors', icon: UserMinus },
  { name: 'Total Regional Users', href: '/admin-dashboard/regional-users', icon: Globe },
  { name: 'Manual Blood Donor', href: '/admin-dashboard/manual-blood-donor', icon: Droplet },
  { name: 'Manual Organ Donor', href: '/admin-dashboard/manual-organ-donor', icon: Heart },
  { name: 'Homepage Image Slider', href: '/admin-dashboard/slider-manager', icon: ImageIcon },
  { name: 'Write Blog', href: '/admin-dashboard/write-blog', icon: PenTool },
  { name: 'Total Click Count', href: '/admin-dashboard/click-analytics', icon: MousePointerClick },
  { name: 'Heatmap', href: '/admin-dashboard/heatmap', icon: Map },
  { name: 'Theme Control', href: '/admin-dashboard/theme-control', icon: Palette },
  { name: 'Spam Monitor', href: '/admin-dashboard/spam-monitor', icon: AlertTriangle },
  { name: 'Policy Update', href: '/admin-dashboard/policy', icon: Shield },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          router.replace('/dashboard/admin-login');
          return;
        }

        const payload = await res.json();
        const role = payload?.user?.role;
        if (!role || !['ADMIN', 'MANAGER'].includes(role)) {
          router.replace('/dashboard/admin-login');
          return;
        }
      } catch (error) {
        router.replace('/dashboard/admin-login');
        return;
      } finally {
        setIsCheckingSession(false);
      }
    };

    verifyAdminSession();
  }, [router]);

  if (isCheckingSession) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115]" />;
  }

  const getCurrentPageTitle = () => {
    const route = MENU_ITEMS.find(item => item.href === pathname);
    return route ? route.name : 'Admin Command Center';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1a1b23] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            Admin Center
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            System Modules
          </p>
          
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={isActive ? 'text-red-500 dark:text-red-400' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#1a1b23] border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-gray-500 p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold truncate">
              {getCurrentPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Global Search */}
            <div className="hidden md:flex items-center bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-full px-4 py-1.5 w-64 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Global search..." 
                className="bg-transparent text-sm w-full outline-none text-gray-800 dark:text-gray-200"
              />
            </div>

            <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1b23]"></span>
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings size={20} />
            </button>

            {/* Admin Avatar */}
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 border border-red-200 dark:border-red-500/30 flex items-center justify-center font-bold text-sm ml-2">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-[#0f1115]">
          <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
