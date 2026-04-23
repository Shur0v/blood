import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageSlide } from "@/src/types/homepageSlide";

const fallbackSlides: HomepageSlide[] = [
  {
    id: "fallback-1",
    order: 1,
    status: "ACTIVE",
    title: "Saving Lives Together",
    image_url: "https://surgmedia.com/wp-content/uploads/2020/10/2171-blood-donation.jpg",
    description: "Your donation can save up to three lives."
  },
  {
    id: "fallback-2",
    order: 2,
    status: "ACTIVE",
    title: "Advanced Medical Care",
    image_url: "https://ichef.bbci.co.uk/news/480/cpsprodpb/a97f/live/81fd48e0-fddb-11ef-ab73-2916b85f325b.jpg.webp",
    description: "State-of-the-art facilities for a safe experience."
  },
  {
    id: "fallback-3",
    order: 3,
    status: "ACTIVE",
    title: "Community Support",
    image_url: "https://www.manipalhospitals.com/uploads/blog/Blood_Donation.png",
    description: "A network of heroes ready to help."
  }
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<HomepageSlide[]>(fallbackSlides);

  const loadSlides = useCallback(async () => {
    try {
      const res = await fetch("/api/public/homepage-slides", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) return;
      const payload = await res.json();
      if (!payload?.success || !Array.isArray(payload.data) || payload.data.length === 0) return;

      setSlides(payload.data);
      setCurrentIndex((prev) => (prev >= payload.data.length ? 0 : prev));
    } catch (error) {
      // keep fallback slides
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      await loadSlides();
    })();

    return () => {
      mounted = false;
    };
  }, [loadSlides]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      void loadSlides();
    }, 10000);
    return () => clearInterval(refreshTimer);
  }, [loadSlides]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % Math.max(slides.length, 1));
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="relative h-[600px] w-full overflow-hidden rounded-[8px] shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentIndex].image_url}
              alt={slides[currentIndex].title}
              className="h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-16 left-16 max-w-xl text-white">
              <motion.h3 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-4 text-5xl font-bold"
              >
                {slides[currentIndex].title}
              </motion.h3>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300"
              >
                {slides[currentIndex].description || ""}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2">
          <button
            onClick={prevSlide}
            className="glass flex h-14 w-14 items-center justify-center rounded-[8px] text-white transition-all hover:bg-glass"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        </div>
        <div className="absolute top-1/2 right-8 -translate-y-1/2">
          <button
            onClick={nextSlide}
            className="glass flex h-14 w-14 items-center justify-center rounded-[8px] text-white transition-all hover:bg-glass"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-8 right-16 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index ? "w-8 bg-primary-dark" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
