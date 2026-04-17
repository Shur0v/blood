import Link from 'next/link';
import { User, ShieldAlert } from 'lucide-react';

export default function DashboardEntry() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 soft-moving-bg relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary-glow)] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-main)] mb-4">System Portal</h1>
        <p className="text-[var(--text-muted)] max-w-md mx-auto">
          Select the appropriate administrative access level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
        <Link href="/dashboard/user-login" className="glass group block rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 hover:shadow-[var(--shadow-hover)] cursor-pointer">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">User Management</h2>
          <p className="text-[var(--text-muted)] mb-6">Process organ requests, verify donors, review blogs, and manage reports.</p>
          <div className="text-[var(--primary)] font-medium flex items-center gap-2">
            Enter Portal
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </Link>
        
        <Link href="/dashboard/admin-login" className="glass group block rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 hover:shadow-[var(--shadow-hover)] cursor-pointer">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Admin Command Center</h2>
          <p className="text-[var(--text-muted)] mb-6">Manage global SEO, system settings, programmatic configurations and roles.</p>
          <div className="text-purple-500 font-medium flex items-center gap-2">
            Enter Portal
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
