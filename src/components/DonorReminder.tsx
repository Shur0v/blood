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
        className="glass soft-moving-bg relative overflow-hidden rounded-[28px] p-6 shadow-card transition-all sm:p-8 md:p-10"
      >
        <div className="relative z-10 grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HeartHandshake className="h-8 w-8 stroke-[1.6]" />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary sm:text-xs">
              <ShieldCheck className="h-4 w-4" />
              Be ready before the call comes
            </p>
            <h2 className="max-w-3xl text-2xl font-black leading-tight tracking-tight text-text sm:text-3xl md:text-4xl">
              Register to donate today. Tomorrow, someone near you may be waiting for the blood only you can give.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-muted sm:text-base">
              A few minutes now can become the reason a parent, friend, or neighbour gets another morning with their family.
            </p>
          </div>

          {showSignUpButton && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSignUpClick}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-text px-8 text-xs font-black uppercase tracking-widest text-inverse shadow-lg shadow-text/20 transition-colors hover:bg-text/80"
            >
              Register Now
            </motion.button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
