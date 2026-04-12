import React from "react";
import { motion } from "motion/react";
import { UserPlus, Search, HeartPulse } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="h-8 w-8 stroke-[1.5]" />,
    title: "Register",
    desc: "Create your profile in seconds and join our global network of life-savers."
  },
  {
    icon: <Search className="h-8 w-8 stroke-[1.5]" />,
    title: "Match",
    desc: "Our smart algorithm connects you with urgent requests based on location and type."
  },
  {
    icon: <HeartPulse className="h-8 w-8 stroke-[1.5]" />,
    title: "Save",
    desc: "Coordinate with recipients and make a life-saving impact instantly."
  }
];

export default function ProcessSteps() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="mb-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-black tracking-tight text-gray-900 uppercase"
        >
          How it Works
        </motion.h2>
        <div className="mt-2 h-1.5 w-24 bg-accent-red mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-50 text-accent-red transition-transform hover:scale-110">
              {step.icon}
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 uppercase tracking-tight">
              {step.title}
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500 font-medium">
              {step.desc}
            </p>
            
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute right-0 top-1/2 h-px w-24 -translate-y-1/2 bg-gradient-to-r from-gray-100 to-transparent" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
