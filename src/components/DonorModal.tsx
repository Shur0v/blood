import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, MapPin, Droplet, CalendarDays } from "lucide-react";

interface Donor {
  name: string;
  phone: string;
  group: string;
  location: string;
  verificationStatus?: string | null;
  hemoglobin?: string | null;
  lastDonationDate?: string | null;
}

interface DonorModalProps {
  donor: Donor | null;
  onClose: () => void;
}

export default function DonorModal({ donor, onClose }: DonorModalProps) {
  if (!donor) return null;
  const isVerified = donor.verificationStatus === "VERIFIED";
  const hasHemoglobin = donor.hemoglobin && donor.hemoglobin.trim().length > 0;
  const hasLastDonationDate = donor.lastDonationDate && donor.lastDonationDate.trim().length > 0;
  const formattedLastDonationDate = hasLastDonationDate
    ? new Date(donor.lastDonationDate as string).toLocaleDateString()
    : null;

  return (
    <AnimatePresence>
      {donor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-card backdrop-blur-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              {/* Blood Group Badge */}
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-dark text-3xl font-black text-white shadow-card">
                {donor.group}
              </div>

              <h2 className="mb-2 text-2xl font-black tracking-tight text-gray-900 uppercase">
                {donor.name}
              </h2>
              
              <div className="mb-8 flex flex-col gap-3">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-primary-dark" />
                  <span className="text-sm font-bold">{donor.location}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-primary-dark" />
                  <span className="text-sm font-bold">{donor.phone}</span>
                </div>
              </div>

              {(hasHemoglobin || formattedLastDonationDate) && (
                <div className="mb-6 flex flex-col gap-2 rounded-2xl bg-white/60 px-4 py-3 text-left">
                  {hasHemoglobin && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Droplet className="h-4 w-4 text-primary-dark" />
                      <span className="text-xs font-semibold">Hemoglobin: {donor.hemoglobin} g/dL</span>
                    </div>
                  )}
                  {formattedLastDonationDate && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarDays className="h-4 w-4 text-primary-dark" />
                      <span className="text-xs font-semibold">Last Donation: {formattedLastDonationDate}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex w-full flex-col gap-3">
                <motion.a
                  href={`tel:${donor.phone}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-dark py-4 text-lg font-bold text-white shadow-lg shadow-primary-dark/20 transition-all hover:bg-primary-dark/90"
                >
                  <Phone className="h-5 w-5" />
                  Call Now
                </motion.a>
              </div>

              {isVerified && (
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Verified Life Saver
                </p>
              )}
            </div>

            {/* Decorative background glow */}
            <div className="absolute -left-20 -top-20 -z-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 -z-10 h-40 w-40 rounded-full bg-primary-dark/10 blur-3xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
