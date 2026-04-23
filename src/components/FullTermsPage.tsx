import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileText, ShieldCheck } from "lucide-react";

export const FullTermsPage = () => {
  const fallbackTerms = `Terms & Conditions (BloodNet)

BloodNet is a donor-recipient matching platform only. Organ selling is a crime and strictly prohibited. Donors must register only for free donation support.`;
  const [content, setContent] = useState(fallbackTerms);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/public/policy-content', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) return;
        setContent(payload.data.termsOfService || fallbackTerms);
        setUpdatedAt(payload.data.updatedAt || null);
      } catch {
        // fallback remains
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-bg font-inter text-gray-800">
      <div className="bg-white border-b border-gray-200 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-[4px] text-primary">Legal</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-6xl mb-4">
            Terms & Conditions
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Last updated: {updatedAt ? new Date(updatedAt).toLocaleDateString() : "Not published yet"}.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <ShieldCheck className="h-5 w-5" />
            Zero-Tolerance Notice
          </div>
          <p className="mt-2 text-sm text-red-700">
            Organ selling is illegal and strictly prohibited. BloodNet supports only lawful, free donation matching.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base font-sans">{content}</pre>
        </div>
      </div>
    </main>
  );
};
