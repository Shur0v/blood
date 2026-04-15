import { motion } from "motion/react";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[8px] bg-gradient-to-r from-primary-dark via-primary to-gray-900 p-16 text-white shadow-2xl"
      >
        <div className="relative z-10 flex flex-col items-center justify-between gap-12 md:flex-row">
          <div className="max-w-2xl">
            <h2 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
              Donate an Organ <br />
              <span className="text-white/80">Become a donor now</span>
            </h2>
            <p className="text-xl text-white/70">
              Your contribution can change the world. Join our premium network of life-savers today.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,255,0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden rounded-[8px] bg-white px-12 py-6 text-xl font-bold text-primary-dark shadow-2xl transition-all"
          >
            <span className="relative z-10">Sign Up Now</span>
            <div className="absolute inset-0 -z-10 translate-y-full bg-primary-dark/10 transition-transform group-hover:translate-y-0" />
            
            {/* Glossy Reflection Effect */}
            <div className="absolute top-0 -left-full h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-1000 group-hover:left-full" />
          </motion.button>
        </div>

        {/* Floating Glows */}
        <div className="absolute -top-1/2 -left-1/4 h-full w-full rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 h-full w-full rounded-full bg-black/10 blur-[120px]" />
      </motion.div>
    </section>
  );
}
