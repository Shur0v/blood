import { motion } from "motion/react";
import { HeartHandshake, ShieldCheck } from "lucide-react";

interface DonorReminderProps {
  onSignUpClick?: () => void;
  showSignUpButton?: boolean;
}

export default function DonorReminder({ onSignUpClick, showSignUpButton = true }: DonorReminderProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[8px] border border-red-100 bg-white p-6 shadow-[0_20px_70px_rgba(190,18,60,0.10)] sm:p-8 md:p-10"
      >
        <div className="relative z-10 grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-primary shadow-inner">
            <HeartHandshake className="h-8 w-8 stroke-[1.6]" />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Be ready before the call comes
            </p>
            <h2 className="max-w-3xl text-2xl font-black leading-tight text-gray-950 sm:text-3xl md:text-4xl">
              Register to donate today. Tomorrow, someone near you may be waiting for the blood only you can give.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-gray-600 sm:text-base">
              A few minutes now can become the reason a parent, friend, or neighbour gets another morning with their family.
            </p>
          </div>

          {showSignUpButton && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSignUpClick}
              className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-primary px-7 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/25 transition-colors hover:bg-primary-dark"
            >
              Register Now
            </motion.button>
          )}
        </div>

        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-red-50 to-transparent" />
      </motion.div>
    </section>
  );
}
