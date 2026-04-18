import React, { useState } from "react";
import { motion } from "motion/react";
import { HeartPulse, Upload, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";

export default function RequestOrgan() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("Kidney");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 1500);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-24" id="request-organ">
      <div className="mb-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-black tracking-tight text-text uppercase"
        >
          Request an Organ
        </motion.h2>
        <p className="mt-4 font-medium text-muted">
          Submit a request to find a matching donor. All requests undergo global medical review before publication.
        </p>
        <div className="mt-4 h-1.5 w-24 bg-primary mx-auto rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass soft-moving-bg relative overflow-hidden rounded-[32px] p-8 shadow-card transition-all"
      >
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-text uppercase tracking-tight">Recipient Application</h3>
              <p className="text-xs font-bold text-muted uppercase tracking-widest">Medical Verification Required</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-600">
            <AlertCircle className="h-4 w-4" />
            Admin Approval Pending
          </div>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-2xl font-black text-text uppercase tracking-tight">Request Submitted!</h4>
            <p className="mt-4 text-sm font-medium text-muted max-w-md">
              Your request for a <strong>{selectedOrgan}</strong> has been securely submitted. 
              Our medical admins will verify the documents and approve your listing shortly.
            </p>
            <button 
              onClick={() => setStatus("idle")}
              className="mt-8 rounded-full bg-text px-8 py-3 text-xs font-black uppercase tracking-widest text-inverse transition hover:bg-text/80"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Required Organ</label>
                <select 
                  value={selectedOrgan}
                  onChange={(e) => setSelectedOrgan(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Cornea"].map(organ => (
                    <option key={organ} value={organ}>{organ}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Recipient Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Legal Name as per ID"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Urgency / Timeline</label>
                <select className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary">
                  <option>Critical (Under 1 week)</option>
                  <option>High (1-4 weeks)</option>
                  <option>Moderate (1-3 months)</option>
                  <option>General Waitlist</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Receiving Hospital</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Johns Hopkins Medical"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Mobile Number</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+1 (234) 567-8900"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" 
                />
              </div>

              <div className="flex-1 min-h-[120px]">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Medical Documents</label>
                <div className="flex h-[calc(100%-24px)] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-glass transition hover:bg-glass/80 hover:border-primary/50 text-center px-4">
                  <Upload className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-xs font-bold text-muted">Upload prescriptions / lab reports</span>
                  <span className="text-[10px] font-semibold text-muted/60 mt-1">(PDF, JPG up to 10MB)</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Patient Background & Notes</label>
              <textarea 
                required
                rows={4}
                className="w-full resize-none rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" 
                placeholder="Briefly describe the medical history and condition..."
              />
            </div>

            <div className="border-t border-border pt-6 md:col-span-2">
              <div className="mb-6 flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  By submitting, you confirm authorization to request organs on behalf of the registered account via the BloodNet Global Network.
                </p>
              </div>
              <button 
                disabled={status === "submitting"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-text px-6 py-4 text-sm font-black uppercase tracking-widest text-inverse transition hover:bg-text/80 disabled:opacity-70"
              >
                {status === "submitting" ? "Processing..." : "Submit to Verification Board"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}
