"use client";

import Link from "next/link";
import BlogTopNav from "@/src/components/BlogTopNav";

export default function BlogError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <BlogTopNav />
      <main className="mx-auto max-w-2xl px-5 py-20">
        <section role="alert" className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">BloodNet Journal</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Articles are temporarily unavailable</h1>
          <p className="mt-4 leading-relaxed text-slate-600">We couldn’t load the journal right now. Please try again shortly.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button onClick={reset} className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700">Try again</button>
            <Link href="/" className="rounded-xl px-3 py-3 font-semibold text-slate-700 hover:text-red-700">Back to BloodNet</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
