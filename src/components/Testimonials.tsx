import React from "react";
import { motion } from "motion/react";
import { Star, ShieldCheck } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Regular Donor",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    text: "HemaFlow made it so easy to find urgent requests in my area. The real-time alerts are a game changer for the community.",
    rating: 5
  },
  {
    name: "David Chen",
    role: "Recipient",
    avatar: "https://i.pravatar.cc/150?u=david",
    text: "I found a donor within hours thanks to this platform. The verified badge gives so much peace of mind during emergencies.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Medical Volunteer",
    avatar: "https://i.pravatar.cc/150?u=elena",
    text: "The glass UI is beautiful, but the functionality is even better. It's the most efficient blood donation system I've used.",
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="mb-16 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-black tracking-tight text-gray-900 uppercase"
        >
          Community Stories
        </motion.h2>
        <div className="mt-2 h-1.5 w-24 bg-accent-red mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass group relative rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_15px_40px_rgba(193,18,31,0.08)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={t.avatar} 
                  alt={t.name} 
                  className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t.name}</h4>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-600">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[8px] font-bold uppercase">Verified</span>
              </div>
            </div>

            <div className="mb-4 flex gap-0.5">
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <p className="text-sm leading-relaxed text-gray-600 font-medium italic">
              "{t.text}"
            </p>

            {/* Subtle background glow */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-full bg-accent-red/5 blur-2xl transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
