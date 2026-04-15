import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function BloodyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const blobs = containerRef.current.querySelectorAll(".blob");
    
    blobs.forEach((blob) => {
      // Random initial position
      gsap.set(blob, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        scale: 1 + Math.random() * 2,
      });

      // Continuous floating animation
      gsap.to(blob, {
        x: `+=${Math.random() * 400 - 200}`,
        y: `+=${Math.random() * 400 - 200}`,
        duration: 10 + Math.random() * 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Rotation animation
      gsap.to(blob, {
        rotation: 360,
        duration: 20 + Math.random() * 20,
        repeat: -1,
        ease: "none",
      });
    });

    const handleResize = () => {
      blobs.forEach((blob) => {
        gsap.set(blob, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-20 overflow-hidden bg-[#FDFCFB]"
    >
      {/* Bloody Blobs */}
      <div className="blob absolute h-[600px] w-[600px] rounded-full bg-primary-dark/10 blur-[120px]" />
      <div className="blob absolute h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
      <div className="blob absolute h-[700px] w-[700px] rounded-full bg-orange-500/5 blur-[140px]" />
      <div className="blob absolute h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-[80px]" />
      <div className="blob absolute h-[800px] w-[800px] rounded-full bg-primary-dark/5 blur-[160px]" />
      
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")` }} 
      />
    </div>
  );
}
