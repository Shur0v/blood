import {HomeText} from './HomepageContentContext';
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, HeartPulse, Network, Scale, ShieldCheck, Target, UsersRound } from "lucide-react";

interface AboutBloodNetProps { onTermsClick?: () => void; }

const values = [
  { icon: ShieldCheck, label: "Safe", detail: "Trust at every step" },
  { icon: Scale, label: "Lawful", detail: "Ethical by design" },
  { icon: Network, label: "Connected", detail: "People helping people" },
  { icon: HeartPulse, label: "Urgent", detail: "Every minute matters" },
];

export default function AboutBloodNet({ onTermsClick }: AboutBloodNetProps) {
  const reducedMotion = useReducedMotion();
  return (
    <section aria-labelledby="about-bloodnet-title" className="mx-auto max-w-7xl px-4 pb-16 sm:pb-24">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4 }}
        className="about-panel relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#fafbfc] text-slate-900 shadow-[0_16px_60px_-32px_rgba(15,23,42,0.18)] sm:rounded-[36px]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-rose-100/60 blur-3xl" />
        <div className="relative grid gap-6 px-6 pb-8 pt-10 sm:px-10 sm:pt-14 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16 lg:px-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-600" /> About BloodNet</p>
            <h2 id="about-bloodnet-title" className="max-w-2xl text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl"><HomeText name="aboutTitle">A trusted network.<br /><span className="text-rose-700">A shared hope.</span></HomeText></h2>
            <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-700"><HomeText name="aboutSubtitle">Building the world&apos;s most trusted blood and organ donor network.</HomeText></p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base"><HomeText name="aboutText">BloodNet exists to make urgent donor discovery faster, safer, and easier to coordinate. We are building a lawful matching platform where willing donors, recipients, and care teams can find the right support by location, blood group, organ need, and availability.</HomeText></p>
        </div>
        <div className="relative grid grid-cols-2 gap-3 px-6 sm:px-10 md:grid-cols-4 lg:px-14">
          {values.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:shadow-md sm:p-5">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 transition-colors group-hover:bg-rose-100"><Icon className="h-5 w-5 stroke-[1.7]" /></div>
              <p className="text-sm font-semibold text-slate-900">{label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 px-6 py-6 sm:px-10 sm:py-8 md:grid-cols-2 lg:px-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="mb-3 flex items-center gap-3"><Target className="h-5 w-5 shrink-0 text-rose-700" /><h3 className="text-xl font-semibold tracking-tight">Our vision</h3></div>
            <p className="text-sm leading-7 text-slate-600">To become the biggest blood and organ donor network ever, powered by verified locations, clear donor intent, and a proper matching solution for moments when every minute matters.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="mb-3 flex items-center gap-3"><UsersRound className="h-5 w-5 shrink-0 text-rose-700" /><h3 className="text-xl font-semibold tracking-tight">Our mission</h3></div>
            <p className="text-sm leading-7 text-slate-600">To connect donors and recipients for free, lawful, medically supervised donation support while blocking scams, organ trade, and unsafe coordination from entering the network.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
          <p className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck className="h-4 w-4 shrink-0 text-rose-700" /> Free, ethical, and medically supervised.</p>
          <button type="button" onClick={onTermsClick} className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700">Read our terms <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button>
        </div>
      </motion.div>
    </section>
  );
}
