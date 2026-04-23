import React, { useState } from "react";
import { motion } from "motion/react";
import { HeartPulse, Upload, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import CityLocationAutocomplete, { type LocationSuggestion } from "./CityLocationAutocomplete";
import CountryPhoneInput, { emptyPhoneValue, type PhoneFieldValue } from "./CountryPhoneInput";
import { ORGAN_CATALOG } from "../lib/organCatalog";

export default function RequestOrgan() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    organType: "Kidney",
    bloodGroup: "",
    name: "",
    email: "",
    urgency: "Critical (Under 1 week)",
    hospital: "",
    note: "",
  });
  const [phoneValue, setPhoneValue] = useState<PhoneFieldValue>(emptyPhoneValue());
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [medicalFiles, setMedicalFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      if (!selectedLocation) {
        throw new Error("Please select location from city suggestions.");
      }
      if (!isPhoneValid || !phoneValue.fullPhoneNumber) {
        throw new Error("Please provide a valid phone number.");
      }

      setUploadingFiles(true);
      const uploadedUrls: string[] = [];
      for (const file of medicalFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", "MEDICAL_AID");
        const uploadRes = await fetch("/api/uploads/image", {
          method: "POST",
          body: fd,
        });
        const uploadPayload = await uploadRes.json();
        if (!uploadRes.ok || !uploadPayload.success || !uploadPayload.data?.url) {
          throw new Error(uploadPayload.message || "Failed to upload medical documents.");
        }
        uploadedUrls.push(uploadPayload.data.url);
      }

      const res = await fetch("/api/public/organ-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contact: phoneValue.fullPhoneNumber,
          phone: {
            country_name: phoneValue.countryName,
            country_code: phoneValue.countryCode,
            dial_code: phoneValue.dialCode,
            local_phone_number: phoneValue.localPhoneNumber,
            full_phone_number: phoneValue.fullPhoneNumber,
          },
          organType: formData.organType,
          location: selectedLocation,
          medicalNote: `${formData.note}\nUrgency: ${formData.urgency}\nHospital: ${formData.hospital}`,
          bloodGroup: formData.bloodGroup,
          prescriptionImages: uploadedUrls,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || "Failed to submit organ request.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("idle");
      setErrorMsg(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setUploadingFiles(false);
    }
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
        className="glass soft-moving-bg relative overflow-hidden rounded-[28px] p-6 sm:p-8 shadow-card transition-all"
      >
        <div className="mb-7 flex flex-col gap-4 border-b border-border pb-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
              <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg leading-tight sm:text-xl font-black text-text uppercase tracking-tight">Recipient Application</h3>
              <p className="mt-1 text-[11px] sm:text-xs font-bold text-muted uppercase tracking-widest">Medical Verification Required</p>
            </div>
          </div>
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-2xl bg-blue-500/10 px-3.5 py-2.5 text-[11px] sm:text-xs font-bold text-blue-600 leading-tight">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="break-words">Admin Approval Pending</span>
          </div>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-2xl font-black text-text uppercase tracking-tight">Request Submitted!</h4>
            <p className="mt-4 text-sm font-medium text-muted max-w-md">
              Your request for a <strong>{formData.organType}</strong> has been submitted to database and will now show in user/admin management queues.
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setFormData({
                  organType: "Kidney",
                  bloodGroup: "",
                  name: "",
                  email: "",
                  urgency: "Critical (Under 1 week)",
                  hospital: "",
                  note: "",
                });
                setPhoneValue(emptyPhoneValue());
                setIsPhoneValid(false);
                setSelectedLocation(null);
                setMedicalFiles([]);
              }}
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
                  value={formData.organType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, organType: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {ORGAN_CATALOG.map((organ) => (
                    <option key={organ} value={organ}>{organ}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Legal Name as per ID"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Blood Group *</label>
                <select
                  required
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <CityLocationAutocomplete
                label="Location"
                placeholder="Search your city"
                required
                selectedLocation={selectedLocation}
                onSelect={setSelectedLocation}
                onClear={() => setSelectedLocation(null)}
              />
            </div>

            <div className="space-y-6 flex flex-col">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Urgency / Timeline</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, urgency: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Critical (Under 1 week)</option>
                  <option>High (1-4 weeks)</option>
                  <option>Moderate (1-3 months)</option>
                  <option>General Waitlist</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Receiving Hospital</label>
                <input
                  type="text"
                  required
                  value={formData.hospital}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hospital: e.target.value }))}
                  placeholder="e.g. Johns Hopkins Medical"
                  className="w-full rounded-2xl border border-border bg-glass px-4 py-3.5 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <CountryPhoneInput
                label="Mobile Number"
                required
                value={phoneValue}
                onChange={setPhoneValue}
                onValidityChange={(valid) => setIsPhoneValid(valid)}
              />

              <div className="flex-1 min-h-[120px]">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Medical Documents</label>
                <label className="flex h-[calc(100%-24px)] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-glass text-center px-4 transition hover:border-primary/60">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMedicalFiles(files.slice(0, 20));
                    }}
                  />
                  <Upload className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-xs font-bold text-muted">Upload medical documents (multiple allowed)</span>
                  <span className="text-[10px] font-semibold text-muted/60 mt-1">JPG, PNG, WEBP up to 10MB each (max 20 files)</span>
                  {medicalFiles.length > 0 && (
                    <div className="mt-3 w-full space-y-1 rounded-xl bg-white/40 p-2 text-left">
                      {medicalFiles.map((file) => (
                        <p key={`${file.name}-${file.size}`} className="truncate text-[10px] font-bold text-text">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Patient Background & Notes</label>
              <textarea
                required
                rows={4}
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
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
              {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {errorMsg}
                </div>
              )}
              <button
                disabled={status === "submitting" || uploadingFiles || !selectedLocation || !isPhoneValid}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-text px-6 py-4 text-sm font-black uppercase tracking-widest text-inverse transition hover:bg-text/80 disabled:opacity-70"
              >
                {status === "submitting" || uploadingFiles ? "Submitting..." : "Submit to Verification Board"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </section>
  );
}
