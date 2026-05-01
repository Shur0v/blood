import type { Metadata } from "next";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicFaqs } from "@/src/backend/services/faqService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about BloodNet donation safety, policy, and usage.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getPublicFaqs(getPrisma());

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-5xl">Frequently Asked Questions</h1>
      <p className="mt-3 text-sm font-medium text-gray-600 md:text-base">
        Clear answers about BloodNet safety rules, legal policy, and donor-recipient workflows.
      </p>

      <div className="mt-8 space-y-4">
        {faqs.map((item) => (
          <article key={item.id} className="rounded-[8px] border border-border/20 bg-white/80 p-5">
            <h2 className="text-lg font-bold text-gray-900">{item.question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.answer}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
