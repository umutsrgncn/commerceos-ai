"use client";

import React, { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: {
  items: { quote: string; name: string; title: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const dup = item.cloneNode(true);
        scrollerRef.current?.appendChild(dup);
      });
      containerRef.current.style.setProperty(
        "--animation-direction",
        direction === "left" ? "forwards" : "reverse",
      );
      containerRef.current.style.setProperty(
        "--animation-duration",
        speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s",
      );
      setStart(true);
    }
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]",
        className,
      )}
    >
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 0.5rem)); }
        }
        .animate-scroll {
          animation: scroll var(--animation-duration, 40s)
            var(--animation-direction, forwards) linear infinite;
        }
      `}</style>
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            className="relative w-[300px] max-w-full shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-6 py-5 md:w-[380px]"
          >
            <div className="text-sm font-medium leading-snug text-white/85">
              {item.quote}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-[10px] font-bold text-white">
                {item.name.charAt(0)}
              </span>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white">
                  {item.name}
                </div>
                <div className="text-[10px] text-white/45">{item.title}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
