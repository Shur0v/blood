import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, HeartHandshake } from "lucide-react";

interface DonorReminderProps {
  onSignUpClick?: () => void;
  showSignUpButton?: boolean;
}

export default function DonorReminder({ onSignUpClick, showSignUpButton = true }: DonorReminderProps) {
  const reducedMotion = useReducedMotion();
  return (
    <section aria-labelledby="donor-reminder-heading" className="mx-auto max-w-7xl px-4 pb-20">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: reducedMotion ? 0 : 0.45 }}
        className="glass soft-moving-bg relative overflow-hidden rounded-[28px] p-6 shadow-card sm:p-8 lg:p-12"
      >
        <div className="relative z-10 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HeartHandshake aria-hidden="true" className="h-6 w-6 stroke-[1.6]" />
              </span>
              <p className="flex items-center gap-1.5 text-xs font-semibold leading-5 text-rose-700 sm:text-sm">
                Be ready before the call comes
              </p>
            </div>
            <h2 id="donor-reminder-heading" className="max-w-3xl text-[28px] font-semibold leading-[1.2] tracking-tight text-slate-900 sm:text-4xl lg:text-[42px]">
              Register to donate today.{" "}
              <span className="mt-3 block text-xl font-medium leading-[1.4] tracking-normal text-slate-700 sm:text-2xl lg:text-[28px]">Tomorrow, someone near you may be waiting for the blood only you can give.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              A few minutes now can become the reason a parent, friend, or neighbour gets another morning with their family.
            </p>
          </div>

          {showSignUpButton && (
            <motion.button
              type="button"
              whileHover={reducedMotion ? undefined : { y: -2 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={onSignUpClick}
              className="group inline-flex min-h-14 w-full items-center justify-between gap-6 rounded-full bg-slate-900 py-2 pl-6 pr-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-colors hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700 lg:w-auto lg:min-w-48"
            >
              Register Now
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"><ArrowUpRight aria-hidden="true" className="h-5 w-5" /></span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
