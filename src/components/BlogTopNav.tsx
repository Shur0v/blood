import Link from "next/link";
import { Droplet, Home } from "lucide-react";

export default function BlogTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-dark">
            <Droplet className="h-5 w-5 fill-white text-white" />
          </span>
          <span className="text-lg font-black tracking-tight text-[#0F172A]">BloodNet</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            <Home className="h-4 w-4" />
            Homepage
          </Link>
        </nav>
      </div>
    </header>
  );
}
