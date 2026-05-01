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
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="glass rounded-[8px] border border-white/40 p-6 shadow-card md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-dark text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Contact Us</h2>
            <p className="text-sm font-medium text-gray-600">Send your email and message. We will review and reply quickly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(blockLinksOnInput(e.target.value))}
            placeholder="Your email address"
            className="w-full rounded-[8px] border border-border bg-white/80 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary-dark focus:ring-1 focus:ring-primary-dark"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(blockLinksOnInput(e.target.value))}
            placeholder="Write your message"
            className="min-h-[120px] w-full resize-y rounded-[8px] border border-border bg-white/80 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary-dark focus:ring-1 focus:ring-primary-dark"
          />

          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between gap-3">
            {status ? (
              <p className={`text-xs font-bold ${status.ok ? "text-emerald-700" : "text-red-700"}`}>{status.text}</p>
            ) : (
              <p className="text-xs font-medium text-gray-500">Links are blocked for security. Spam and malicious payloads are auto-filtered.</p>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submit()}
              className="inline-flex items-center gap-2 rounded-[8px] bg-primary-dark px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
