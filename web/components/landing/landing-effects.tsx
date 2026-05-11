"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll — Lenis + tüm `a[href^="#"]` linklerine yumuşak scroll.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Hash linkler için preventDefault + lenis.scrollTo
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!target) return;
      const id = target.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { duration: 2.2, offset: -40 });
    }
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      lenis.destroy();
    };
  }, []);

  return null;
}

/**
 * Hero background — animated floating orbs (purely CSS + position).
 * Çok hafif, no WebGL.
 */
export function HeroBgOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      <style>{`
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          mix-blend-mode: screen;
        }
        .hero-orb-1 {
          top: -10%;
          left: 20%;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, #d946ef 0%, transparent 60%);
          animation: orb-float-1 18s ease-in-out infinite;
        }
        .hero-orb-2 {
          top: 10%;
          right: 0%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, #6366f1 0%, transparent 60%);
          animation: orb-float-2 22s ease-in-out infinite;
        }
        .hero-orb-3 {
          bottom: -10%;
          left: -5%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, #10b981 0%, transparent 60%);
          animation: orb-float-3 26s ease-in-out infinite;
        }
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(120px, 60px) scale(1.15); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, 100px) scale(1.1); }
        }
        @keyframes orb-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -80px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
