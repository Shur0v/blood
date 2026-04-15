import React from "react";
import { motion } from "motion/react";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

const blogs = [
  {
    title: "How Stem Cell Therapy Saved My Son's Life",
    snippet: "After months of searching, we finally found a matching donor. The journey was incredibly difficult, but the medical staff and the community made it possible...",
    author: "Muntasir",
    location: "Dhaka",
    avatar: "https://i.pravatar.cc/150?img=11",
    slug: "/blog/stem-cell-therapy-saved-my-son"
  },
  {
    title: "Demystifying the Platelet Donation Process",
    snippet: "Many people fear donating platelets because it takes longer than whole blood. Here is what actually happens and why your contribution is so uniquely vital...",
    author: "Sarah",
    location: "Sylhet",
    avatar: "https://i.pravatar.cc/150?img=5",
    slug: "/blog/demystifying-platelet-donation"
  },
  {
    title: "10 Things to Know Before A Bone Marrow Transplant",
    snippet: "Preparing for a transplant is overwhelming. To help others navigate this critical phase, I've compiled the most important steps for patients and their families...",
    author: "Dr. Ahmed",
    location: "Chittagong",
    avatar: "https://i.pravatar.cc/150?img=12",
    slug: "/blog/bone-marrow-transplant-prep"
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
        <p className="mt-4 font-medium text-gray-500">Inspiring journeys and medical insights written by our users.</p>
        <div className="mt-4 h-1.5 w-24 bg-accent-red mx-auto rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {blogs.map((blog, i) => (
          <Link href={blog.slug} key={i} className="block group h-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass soft-moving-bg relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(193,18,31,0.12)]"
            >
              <div>
                <h3 className="mb-4 text-xl font-black leading-tight text-gray-900 group-hover:text-blood-red transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 font-medium mb-8">
                  {blog.snippet}
                </p>
              </div>

              <div className="mt-auto border-t border-black/5 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3 relative z-10">
                  <img 
                    src={blog.avatar} 
                    alt={blog.author} 
                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{blog.author}</h4>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <MapPin className="h-3 w-3 text-accent-red" />
                      {blog.location}
                    </div>
                  </div>
                </div>
                
                {/* Arrow Icon with Hover animation */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-black/5 text-gray-900 transition-all duration-300 group-hover:bg-blood-red group-hover:text-white group-hover:ring-blood-red">
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
