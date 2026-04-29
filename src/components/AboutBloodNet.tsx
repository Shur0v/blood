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
        className="glass soft-moving-bg relative overflow-hidden rounded-[28px] shadow-card transition-all"
      >
        <div className="px-6 pb-12 pt-14 text-center sm:px-10">
          <p className="text-xs font-black uppercase tracking-widest text-primary">About Us</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-text sm:text-4xl md:text-5xl">
            Building the world&apos;s most trusted blood and organ donor network.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-muted sm:text-base">
            BloodNet exists to make urgent donor discovery faster, safer, and easier to coordinate. We are building a lawful matching platform where willing donors, recipients, and care teams can find the right support by location, blood group, organ need, and availability.
          </p>
        </div>

        <div className="mx-auto -mt-2 grid max-w-3xl grid-cols-2 gap-3 rounded-[24px] bg-text p-4 text-inverse shadow-2xl shadow-text/20 sm:grid-cols-4 sm:p-5">
          {values.map((value) => (
            <div key={value.label} className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-[16px] bg-inverse/5 text-center transition-colors hover:bg-inverse/10">
              <div className="text-primary">{value.icon}</div>
              <p className="text-xs font-black uppercase tracking-widest text-inverse/85">{value.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-0 px-6 py-12 sm:px-10 md:grid-cols-2 md:px-16">
          <div className="border-b border-border pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-12">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <Target className="h-6 w-6" />
              <h3 className="text-2xl font-black text-text">Vision</h3>
            </div>
            <p className="text-sm font-medium leading-7 text-muted">
              To become the biggest blood and organ donor network ever, powered by verified locations, clear donor intent, and a proper matching solution for moments when every minute matters.
            </p>
          </div>

          <div className="pt-8 md:pl-12 md:pt-0">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <UsersRound className="h-6 w-6" />
              <h3 className="text-2xl font-black text-text">Mission</h3>
            </div>
            <p className="text-sm font-medium leading-7 text-muted">
              To connect donors and recipients for free, lawful, medically supervised donation support while blocking scams, organ trade, and unsafe coordination from entering the network.
            </p>
          </div>
        </div>

        <div className="flex justify-center px-6 pb-12">
          <button
            type="button"
            onClick={onTermsClick}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-text px-8 text-xs font-black uppercase tracking-widest text-inverse transition hover:bg-text/80"
          >
            Read Our Terms
          </button>
        </div>
      </motion.div>
    </section>
  );
}
