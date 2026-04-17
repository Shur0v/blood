export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 soft-moving-bg relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 text-center glass p-12 rounded-[2rem] border border-purple-500/20 max-w-lg w-full shadow-2xl">
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-4">Admin Command Center</h1>
        <p className="text-[var(--text-muted)] mb-8">
          The admin dashboard is currently under construction.
          This secure area will handle system-wide configuration, SEO, and global settings.
        </p>
        
        <div className="inline-block px-6 py-3 bg-[var(--bg-app)] border border-purple-500/30 text-purple-500 font-medium rounded-xl">
          Super Admin Access Required
        </div>
      </div>
    </div>
  );
}
