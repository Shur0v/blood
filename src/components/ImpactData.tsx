import usePublicNetwork from './usePublicNetwork';
import React from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState } from "react";

export default function ImpactData() {
  const network=usePublicNetwork();
  const stats=[{label:'Registered accounts',suffix:'',target:network?.totalRegisteredAccounts||0},{label:'Countries',suffix:'',target:network?.activeCountries||0},{label:'Donor listings',suffix:'',target:network?.totalListingCount||0},{label:'Recorded cities',suffix:'',target:network?.activeCities||0}];
  return (
    <section className="relative overflow-hidden py-24 bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <Counter
              key={i}
              label={stat.label}
              target={stat.target}
              suffix={stat.suffix}
              delay={i * 0.1}
              pending={!network}
            />
          ))}
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 h-full w-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-dark/5 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      </div>
    </section>
  );
}

interface CounterProps {
  label: string;
  target: number;
  suffix: string;
  delay: number;
  pending?:boolean;
  key?: React.Key;
}

const Counter = ({ label, target, suffix, delay, pending }: CounterProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, target, {
      duration: 2,
      delay: delay,
      ease: "easeOut"
    });
    return animation.stop;
  }, [count, target, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="mb-2 flex items-center justify-center">
        <motion.span className="text-5xl font-semibold tracking-tighter text-text md:text-7xl">
          {pending?'—':rounded}
        </motion.span>
        <span className="text-3xl font-semibold tracking-tighter text-text md:text-5xl">
          {suffix}
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-[3px] text-text">
        {label}
      </p>
    </motion.div>
  );
}
