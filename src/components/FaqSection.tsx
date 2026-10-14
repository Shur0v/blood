"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const fallbackFaqs: FaqItem[] = [
  {
    id: "fallback-1",
    question: "Is BloodNet free to use for donors and recipients?",
    answer:
      "Yes. BloodNet is a free donor-recipient matching platform. We do not allow payment for blood or organs on the platform.",
  },
  {
    id: "fallback-2",
    question: "Does BloodNet allow buying or selling organs?",
    answer:
      "No. Organ trade is illegal and strictly prohibited. BloodNet only supports ethical, voluntary, and law-compliant matching workflows.",
  },
  {
    id: "fallback-3",
    question: "How should I handle transportation payment in urgent blood cases?",
    answer:
      "If you choose to support transportation, only pay after the donor physically reaches the verified hospital/medical location.",
  },
];

export default function FaqSection() {
  const [items, setItems] = useState<FaqItem[]>(fallbackFaqs);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/public/faqs", { method: "GET", cache: "no-store" });
        const payload = await res.json();
        if (!res.ok || !payload.success) return;
        if (Array.isArray(payload.data) && payload.data.length > 0) {
          setItems(payload.data);
        }
      } catch {
        // keep silent
      }
    };
    void load();
  }, []);

  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="public-light-panel overflow-hidden rounded-[28px] border border-slate-200 bg-[#fafbfc] text-slate-900 shadow-[0_16px_60px_-32px_rgba(15,23,42,0.18)] sm:rounded-[36px]"
      >
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:p-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-rose-700"><HelpCircle className="h-4 w-4 shrink-0" /> Here to help</p>
            <h2 id="faq-heading" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Frequently asked<br className="hidden lg:block" /> questions.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600 sm:text-base">Quick answers about donation, safety, and platform rules.</p>
          </div>
          <div className="min-w-0 space-y-3">
            {items.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className={`overflow-hidden rounded-2xl border bg-white transition-colors ${open ? "border-rose-200 shadow-sm" : "border-slate-200 hover:border-rose-200"}`}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`faq-answer-${item.id}`}
                      id={`faq-question-${item.id}`}
                      onClick={() => setOpenId(open ? null : item.id)}
                      className="group flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-rose-50/50 sm:px-6"
                    >
                      <span className="text-sm font-semibold leading-6 text-slate-900 sm:text-base">{item.question}</span>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${open ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-700"}`}><ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} /></span>
                    </button>
                  </h3>
                  <div id={`faq-answer-${item.id}`} hidden={!open} aria-labelledby={`faq-question-${item.id}`}>
                    {open && <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 sm:px-6">{item.answer}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
