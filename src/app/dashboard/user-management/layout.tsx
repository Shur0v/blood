'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HeartHandshake, 
  UserCheck, 
  FileText, 
  Users, 
  AlertTriangle,
  Search,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Organ Request', href: '/dashboard/user-management/organ-request', icon: HeartHandshake },
  { name: 'User Verify Request', href: '/dashboard/user-management/verify-request', icon: UserCheck },
  { name: 'Blog Approval', href: '/dashboard/user-management/blog-approval', icon: FileText },
  { name: 'Active Donors', href: '/dashboard/user-management/active-donors', icon: Users },
  { name: 'Reports', href: '/dashboard/user-management/reports', icon: AlertTriangle },
];

export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Derive page title from pathname
  const getCurrentPageTitle = () => {
    const route = MENU_ITEMS.find(item => item.href === pathname);
    return route ? route.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 glass border-r border-[var(--border-main)] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-[var(--border-main)]">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xl">
            <HeartHandshake className="text-[var(--primary)]" />
            <span>HemaFlow</span>
          </div>
          <button className="md:hidden text-[var(--text-main)]" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            User Management
          </p>
          
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/dashboard/user-management' && item.href.includes('organ-request'));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--primary-glow)] text-[var(--primary)] font-medium shadow-sm' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--border-main)] hover:text-[var(--text-main)]'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} className={isActive ? 'text-[var(--primary)]' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-main)]">
          <Link 
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Exit Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 glass border-b border-[var(--border-main)] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-[var(--text-main)] p-2 -ml-2 rounded-lg hover:bg-[var(--border-main)]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] truncate">
              {getCurrentPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar (UI Only) */}
            <div className="hidden md:flex items-center bg-[var(--bg-app)] border border-[var(--border-main)] rounded-full px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-transparent transition-all">
              <Search size={16} className="text-[var(--text-muted)] mr-2" />
              {/* This field will trigger a search on future API (/api/search) */}
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent text-sm w-full outline-none text-[var(--text-main)]"
              />
            </div>

            <button className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-full hover:bg-[var(--border-main)]">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-[var(--border-main)]">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-glow)] flex items-center justify-center border border-[var(--primary)]/20 shadow-sm overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Admin`} alt="Admin Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-[var(--text-main)] leading-tight">Admin User</p>
                <p className="text-xs text-[var(--text-muted)]">Operations Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Subtle background blob for medical feel */}
          <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-[var(--primary-glow)] rounded-full blur-[150px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
