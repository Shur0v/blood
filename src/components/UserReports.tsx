import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Send, CheckCircle2 } from "lucide-react";

export default function UserReports() {
  const [reportStatus, setReportStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [reportType, setReportType] = useState<"Scam Report" | "Suggestion" | "Other">("Scam Report");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");

  const handleReportSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setReportStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          subject,
          details,
          contact: contact || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Failed to submit report.");
      }

      setReportStatus("success");
    } catch (error) {
      setReportStatus("idle");
      setErrorMsg(error instanceof Error ? error.message : "Failed to submit report.");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-24" id="community-reports">
      <div className="mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-black tracking-tight text-gray-900 uppercase"
        >
          Community Guardian
        </motion.h2>
        <p className="mt-4 text-gray-500 font-medium">Protect the community & share your suggestions to improve the platform.</p>
        <div className="mt-4 h-1.5 w-24 bg-primary mx-auto rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass soft-moving-bg relative flex flex-col justify-between overflow-hidden rounded-[24px] p-8 transition-all shadow-card"
      >
        <div>
          <div className="mb-6 flex items-center gap-4 border-b border-black/5 pb-4">
            <div className="rounded-xl bg-primary-dark/10 p-3 text-primary-dark">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Report & Feedback</h3>
              <p className="text-xs font-medium text-gray-500">Help us keep the platform safe and improving.</p>
            </div>
          </div>

          {reportStatus === "success" ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Submission Received</h4>
              <p className="mt-2 text-sm text-gray-500">Stored to database and now visible in user-management/admin reports queue.</p>
              <button
                onClick={() => {
                  setReportStatus("idle");
                  setReportType("Scam Report");
                  setSubject("");
                  setDetails("");
                  setContact("");
                }}
                className="mt-6 rounded-xl bg-gray-100 px-6 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-200"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-gray-500">What is this regarding?</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {["Scam Report", "Suggestion", "Other"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportType(type as "Scam Report" | "Suggestion" | "Other")}
                      className={`rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                        reportType === type
                          ? "bg-primary-dark text-white shadow-lg shadow-primary-dark/20 ring-2 ring-primary-dark/50"
                          : "bg-glass text-gray-600 hover:bg-white/60 ring-1 ring-black/5"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {reportType === "Scam Report" ? "Scammer Details (Name/Number/Profile)" : "Subject"}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-white/50 bg-glass px-4 py-3 text-sm outline-none transition focus:border-primary-dark focus:bg-white/60 focus:ring-1 focus:ring-primary-dark"
                  placeholder={reportType === "Scam Report" ? "e.g. John Doe / +1 234 567 890" : "Give us a brief title..."}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Contact (optional)</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full rounded-xl border border-white/50 bg-glass px-4 py-3 text-sm outline-none transition focus:border-primary-dark focus:bg-white/60 focus:ring-1 focus:ring-primary-dark"
                  placeholder="Email or phone so admin can follow up"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Details</label>
                <textarea
                  required
                  rows={5}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full resize-none rounded-xl border border-white/50 bg-glass px-4 py-3 text-sm outline-none transition focus:border-primary-dark focus:bg-white/60 focus:ring-1 focus:ring-primary-dark"
                  placeholder="Provide specific details..."
                />
              </div>
            </form>
          )}
        </div>

        {reportStatus !== "success" && (
          <>
            {errorMsg && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}
            <button
              disabled={reportStatus === "submitting"}
              onClick={() => handleReportSubmit()}
              className="mt-8 group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-dark px-4 py-3.5 font-bold text-white transition hover:bg-primary disabled:opacity-70"
            >
              {reportStatus === "submitting" ? "Submitting..." : `Submit ${reportType}`}
              <Send className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </>
        )}
      </motion.div>
    </section>
  );
}
