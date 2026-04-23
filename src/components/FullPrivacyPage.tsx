import React, { useEffect, useState } from "react";

export const FullPrivacyPage = () => {
  const fallbackPrivacy = `Privacy Policy (Full)

BloodNet collects profile, contact, location, and donation preference data to enable donor-recipient matching, safety checks, and operations.`;
  const [content, setContent] = useState(fallbackPrivacy);
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
        setContent(payload.data.privacyPolicyFull || fallbackPrivacy);
        setUpdatedAt(payload.data.updatedAt || null);
      } catch {
        // keep fallback
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-bg font-inter text-gray-800">
      <div className="bg-white border-b border-gray-200 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-black uppercase tracking-[4px] text-primary mb-4">Compliance</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-6xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Last updated: {updatedAt ? new Date(updatedAt).toLocaleDateString() : "Not published yet"}.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base font-sans">{content}</pre>
        </div>
      </div>
    </main>
  );
};
