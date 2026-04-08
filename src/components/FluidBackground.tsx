import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function FluidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !bgRef.current) return;

    const blobs = containerRef.current.querySelectorAll(".blob");
    
    // 1. Animate individual blobs for "mixing" effect
    blobs.forEach((blob) => {
      const animateBlob = () => {
        gsap.to(blob, {
          x: gsap.utils.random(-150, 150, true)(),
          y: gsap.utils.random(-150, 150, true)(),
          scale: gsap.utils.random(1.2, 2.0, true)(),
          opacity: gsap.utils.random(0.2, 0.5, true)(), // Increased opacity
          duration: gsap.utils.random(8, 15, true)(),
          ease: "sine.inOut",
          onComplete: animateBlob,
        });
      };
      animateBlob();
    });

    // 2. Removed full background color morphing to keep it white

    // 3. Slow rotation for the blob container
    gsap.to(containerRef.current, {
      rotate: 360,
      duration: 120,
      repeat: -1,
      ease: "none",
    });
  }, []);

  return (
    <div 
      ref={bgRef}
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-white transition-colors duration-1000"
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full">
        {/* More visible, vibrant fluid blobs */}
        <div 
          className="blob absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(193, 18, 31, 0.15) 0%, transparent 70%)" }}
        />
        <div 
          className="blob absolute top-[20%] -right-[10%] h-[60%] w-[60%] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(230, 57, 70, 0.12) 0%, transparent 70%)" }}
        />
        <div 
          className="blob absolute -bottom-[10%] left-[10%] h-[80%] w-[80%] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(193, 18, 31, 0.1) 0%, transparent 70%)" }}
        />
        <div 
          className="blob absolute top-[40%] left-[30%] h-[50%] w-[50%] rounded-full blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(230, 57, 70, 0.08) 0%, transparent 70%)" }}
        />
      </div>
      
      {/* Texture overlay for a more "premium" feel */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
