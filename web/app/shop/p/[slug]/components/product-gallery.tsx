"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ShopImage } from "../../../components/shop-image";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [null];

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
      {/* Ana görsel */}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-lg bg-[color:var(--color-fg)]/[0.04]">
        <ShopImage
          src={list[active] ?? null}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          priority
        />
        {/* Sayaç */}
        {list.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-[color:var(--color-fg)]/85 px-2.5 py-1 text-[10px] font-mono text-[color:var(--color-bg)] backdrop-blur">
            {active + 1} / {list.length}
          </div>
        )}
      </div>

      {/* Thumb list — mobile yatay, desktop dikey */}
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:max-h-[600px] sm:w-20 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/5] h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-auto sm:w-full",
                active === i
                  ? "border-[color:var(--color-fg)]"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
              aria-label={`Görsel ${i + 1}`}
            >
              <ShopImage
                src={src}
                alt={`${alt} ${i + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
