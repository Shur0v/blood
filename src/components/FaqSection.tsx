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
    <section className="mx-auto max-w-7xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass soft-moving-bg rounded-[8px] border border-white/40 p-6 shadow-card md:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-dark text-white">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">Frequently Asked Questions</h2>
            <p className="text-sm font-medium text-gray-600">Quick answers about donation, safety, and platform rules.</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="overflow-hidden rounded-[8px] border border-white/50 bg-white/70">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                >
                  <span className="text-sm font-bold text-gray-900 md:text-base">{item.question}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
                </button>
                {open && <p className="px-4 pb-4 text-sm leading-relaxed text-gray-700">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
