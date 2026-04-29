import { motion } from "motion/react";
import { HeartPulse, Network, Scale, ShieldCheck, Target, UsersRound } from "lucide-react";

interface AboutBloodNetProps {
  onTermsClick?: () => void;
}

const values = [
  { icon: <ShieldCheck className="h-6 w-6 stroke-[1.6]" />, label: "Safe" },
  { icon: <Scale className="h-6 w-6 stroke-[1.6]" />, label: "Lawful" },
  { icon: <Network className="h-6 w-6 stroke-[1.6]" />, label: "Connected" },
  { icon: <HeartPulse className="h-6 w-6 stroke-[1.6]" />, label: "Urgent" },
];

export default function AboutBloodNet({ onTermsClick }: AboutBloodNetProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
      >
        <div className="px-6 pb-12 pt-14 text-center sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">About Us</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight text-gray-950 sm:text-4xl md:text-5xl">
            Building the world&apos;s most trusted blood and organ donor network.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-gray-600 sm:text-base">
            BloodNet exists to make urgent donor discovery faster, safer, and easier to coordinate. We are building a lawful matching platform where willing donors, recipients, and care teams can find the right support by location, blood group, organ need, and availability.
          </p>
        </div>

        <div className="mx-auto -mt-2 grid max-w-3xl grid-cols-2 gap-3 rounded-[8px] bg-gray-950 p-4 text-white shadow-2xl shadow-gray-950/20 sm:grid-cols-4 sm:p-5">
          {values.map((value) => (
            <div key={value.label} className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-[8px] bg-white/5 text-center">
              <div className="text-primary">{value.icon}</div>
              <p className="text-xs font-black uppercase tracking-widest text-white/85">{value.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-0 px-6 py-12 sm:px-10 md:grid-cols-2 md:px-16">
          <div className="border-b border-gray-200 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-12">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <Target className="h-6 w-6" />
              <h3 className="text-2xl font-black text-gray-950">Vision</h3>
            </div>
            <p className="text-sm font-semibold leading-7 text-gray-600">
              To become the biggest blood and organ donor network ever, powered by verified locations, clear donor intent, and a proper matching solution for moments when every minute matters.
            </p>
          </div>

          <div className="pt-8 md:pl-12 md:pt-0">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <UsersRound className="h-6 w-6" />
              <h3 className="text-2xl font-black text-gray-950">Mission</h3>
            </div>
            <p className="text-sm font-semibold leading-7 text-gray-600">
              To connect donors and recipients for free, lawful, medically supervised donation support while blocking scams, organ trade, and unsafe coordination from entering the network.
            </p>
          </div>
        </div>

        <div className="flex justify-center px-6 pb-12">
          <button
            type="button"
            onClick={onTermsClick}
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-primary px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-primary-dark"
          >
            Read Our Terms
          </button>
        </div>
      </motion.div>
    </section>
  );
}
