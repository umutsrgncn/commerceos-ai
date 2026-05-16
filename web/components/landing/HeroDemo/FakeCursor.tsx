"use client";

import { motion, type AnimationControls } from "motion/react";

/**
 * macOS-vari pointer cursor. Konumu parent component'in AnimationControls'u
 * ile sürülür. Click pulse `clicking` prop ile dışarıdan tetiklenir.
 */
export function FakeCursor({
  controls,
  initial,
  clicking,
}: {
  controls: AnimationControls;
  initial: { x: number; y: number };
  clicking: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-50"
      initial={initial}
      animate={controls}
      style={{ willChange: "transform" }}
      aria-hidden
    >
      {/* Click pulse — cursor ucundan yayılır */}
      <motion.span
        key={clicking ? "pulse" : "rest"}
        className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-white/80"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          clicking
            ? { scale: 8, opacity: [0.85, 0] }
            : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* macOS-vari pointer SVG — siyah fill + beyaz stroke + drop-shadow */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
      >
        <path
          d="M4 2.5L18.5 13.5L11.5 14L9 21L4 2.5Z"
          fill="#000"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
