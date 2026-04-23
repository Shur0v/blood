"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

type UserStory = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string | null;
  author_city?: string | null;
  author_profile_image?: string | null;
  is_anonymous?: boolean;
  is_user_story?: boolean;
};

export default function Testimonials() {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [cursor, setCursor] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      if (width < 768) setCardsPerView(1);
      else if (width < 1200) setCardsPerView(2);
      else setCardsPerView(3);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const loadUserStories = async () => {
      try {
        const res = await fetch("/api/public/blogs?authorType=USER&page=1&limit=20", {
          method: "GET",
          cache: "no-store",
        });
        const payload = await res.json();
        if (isCancelled || !res.ok || !payload.success) {
          if (!isCancelled) setStories([]);
          return;
        }
        const rows = (payload.data || []) as Array<any>;
        setStories(
          rows
            .filter((row) => row?.slug && row?.author_type === "USER")
            .map((row) => ({
              id: row.id,
              title: row.title,
              slug: row.slug,
              excerpt: row.excerpt || "",
              author_name: row.is_anonymous ? null : row.author_name || "BloodNet User",
              author_city: row.author_city || null,
              author_profile_image: row.author_profile_image || null,
              is_anonymous: Boolean(row.is_anonymous),
              is_user_story: true,
            })),
        );
      } catch {
        if (!isCancelled) setStories([]);
      }
    };
    void loadUserStories();
    const timer = window.setInterval(() => {
      void loadUserStories();
    }, 12000);
    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (stories.length === 0) return;
    const maxStart = Math.max(0, stories.length - cardsPerView);
    if (cursor > maxStart) {
      setCursor(maxStart);
    }
  }, [stories, cardsPerView, cursor]);

  const visibleStories = useMemo(() => {
    if (stories.length === 0) return [];
    return stories.slice(cursor, cursor + cardsPerView);
  }, [stories, cursor, cardsPerView]);

  const canGoPrev = cursor > 0;
  const canGoNext = cursor + cardsPerView < stories.length;

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
        <div className="mt-4 h-1.5 w-24 bg-primary mx-auto rounded-full" />
      </div>

      <div className="mb-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => canGoPrev && setCursor((prev) => Math.max(0, prev - cardsPerView))}
          disabled={!canGoPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-white text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous stories"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => canGoNext && setCursor((prev) => prev + cardsPerView)}
          disabled={!canGoNext}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-white text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next stories"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {visibleStories.length === 0 ? (
        <div className="rounded-3xl border border-border/10 bg-white p-8 text-center text-sm font-semibold text-gray-500">
          No approved user stories yet.
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-8 ${cardsPerView === 1 ? "" : cardsPerView === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {visibleStories.map((story, i) => (
            <Link href={`/blog/${story.slug}`} key={story.id} className="block group h-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass soft-moving-bg relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] p-8 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card"
              >
                <div>
                  <h3 className="mb-4 text-xl font-black leading-tight text-gray-900 group-hover:text-primary-dark transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 font-medium mb-8">
                    {story.excerpt}
                  </p>
                </div>

                <div className="mt-auto border-t border-black/5 pt-6 flex items-center justify-between">
                  {story.is_anonymous ? (
                    <div className="relative z-10">
                      <h4 className="text-sm font-bold text-gray-900">Anonymous Story</h4>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-3">
                      <img
                        src={story.author_profile_image || "https://i.pravatar.cc/120?u=bloodnet-story"}
                        alt={story.author_name || "Writer"}
                        className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{story.author_name}</h4>
                        {story.author_city && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <MapPin className="h-3 w-3 text-primary" />
                            {story.author_city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-black/5 text-gray-900 transition-all duration-300 group-hover:bg-primary-dark group-hover:text-white group-hover:ring-primary-dark">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
