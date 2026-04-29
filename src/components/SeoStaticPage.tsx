import type { ReactNode } from "react";

interface SeoStaticPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function SeoStaticPage({ eyebrow, title, description, children }: SeoStaticPageProps) {
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-4xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-5 text-lg font-semibold leading-8 text-gray-600">{description}</p>
        <div className="mt-10 space-y-6 rounded-[8px] bg-white p-6 font-semibold leading-8 text-gray-700 shadow-card">
          {children}
        </div>
      </section>
    </main>
  );
}
