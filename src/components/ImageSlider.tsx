import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    url: "https://images.unsplash.com/photo-1615461066841-6116ecaaba7f?auto=format&fit=crop&q=80&w=1920",
    title: "Saving Lives Together",
    desc: "Your donation can save up to three lives."
  },
  {
    url: "https://images.unsplash.com/photo-1579154235602-3c2c2aa59c1b?auto=format&fit=crop&q=80&w=1920",
    title: "Advanced Medical Care",
    desc: "State-of-the-art facilities for a safe experience."
  },
  {
    url: "https://images.unsplash.com/photo-1536856789446-79f526e24933?auto=format&fit=crop&q=80&w=1920",
    title: "Community Support",
    desc: "A network of heroes ready to help."
  },
  {
    url: "https://images.unsplash.com/photo-1581594632702-52c1137c2715?auto=format&fit=crop&q=80&w=1920",
    title: "The Gift of Life",
    desc: "Be the reason someone smiles today."
  },
  {
    url: "https://images.unsplash.com/photo-1584362946045-121f86995c3c?auto=format&fit=crop&q=80&w=1920",
    title: "Join the Movement",
    desc: "Register as a donor in less than 2 minutes."
  }
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

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
              src={slides[currentIndex].url}
              alt={slides[currentIndex].title}
              className="h-full w-full object-cover"
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
                {slides[currentIndex].desc}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2">
          <button
            onClick={prevSlide}
            className="glass flex h-14 w-14 items-center justify-center rounded-[8px] text-white transition-all hover:bg-white/40"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        </div>
        <div className="absolute top-1/2 right-8 -translate-y-1/2">
          <button
            onClick={nextSlide}
            className="glass flex h-14 w-14 items-center justify-center rounded-[8px] text-white transition-all hover:bg-white/40"
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
                currentIndex === index ? "w-8 bg-blood-red" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
