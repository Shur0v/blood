"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";

export default function ContactUsSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const blockLinksOnInput = (value: string) => value.replace(/https?:\/\/\S*|www\.\S*/gi, "");

  const submit = async () => {
    setStatus(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          message: message.trim(),
          website,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setStatus({ ok: false, text: payload.message || "Could not send message." });
        return;
      }
      setStatus({ ok: true, text: payload.message || "Message sent." });
      setMessage("");
      setEmail("");
      setWebsite("");
    } catch {
      setStatus({ ok: false, text: "Could not send message." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="contact-heading" className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <div className="public-light-panel overflow-hidden rounded-[28px] border border-slate-200 bg-[#fafbfc] text-slate-900 shadow-[0_16px_60px_-32px_rgba(15,23,42,0.18)] sm:rounded-[36px]">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:p-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-rose-700"><Mail className="h-4 w-4 shrink-0" /> Get in touch</p>
            <h2 id="contact-heading" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Contact us.<br /><span className="text-rose-700">We’re listening.</span></h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600 sm:text-base">Send your email and message. We will review and reply quickly.</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="contact-email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(blockLinksOnInput(e.target.value))}
                  placeholder="Your email address"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none transition-colors focus:border-rose-700 focus:bg-white focus:ring-2 focus:ring-rose-700/15"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700">Your message</label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(blockLinksOnInput(e.target.value))}
                  placeholder="Write your message"
                  className="min-h-40 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-7 text-slate-900 placeholder:text-slate-500 outline-none transition-colors focus:border-rose-700 focus:bg-white focus:ring-2 focus:ring-rose-700/15"
                />
              </div>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div aria-live="polite" className="min-w-0 max-w-sm">
                  {status ? (
                    <p className={`text-sm font-medium leading-6 ${status.ok ? "text-emerald-700" : "text-red-700"}`}>{status.text}</p>
                  ) : (
                    <p className="text-xs leading-5 text-slate-600">Links are blocked for security. Spam and malicious payloads are auto-filtered.</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submit()}
                  className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                  <Send className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
