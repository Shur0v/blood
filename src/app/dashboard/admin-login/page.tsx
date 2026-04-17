'use client';

import React, { useState } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate directly to admin dashboard
    router.push('/dashboard/admin');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 soft-moving-bg relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute w-full h-full pointer-events-none flex justify-center items-center">
        <div className="w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10 text-purple-500 text-5xl font-bold flex flex-col items-center gap-2">
          <Shield size={48} />
          <h1 className="text-2xl mt-4 text-[var(--text-main)]">Admin Center</h1>
          <p className="text-sm text-[var(--text-muted)] font-normal mt-1">Super Admin Access</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-[2rem] p-8 md:p-10 border-purple-500/10 shadow-[0_8px_30px_rgba(168,85,247,0.05)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2" htmlFor="userId">
                Admin ID / Email
              </label>
              <input
                id="userId"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter admin ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2" htmlFor="password">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:shadow-[0_10px_25px_rgba(168,85,247,0.3)]"
            >
              Secure Login
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        <div className="text-center mt-8 text-sm text-[var(--text-muted)]">
          <p>HemaFlow Encrypted Portal &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
