import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Shop için sade image component'i — placeholder, lazy loading, accent border.
 * next/image kullanılarak optimizasyon dahil.
 */
export function ShopImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]",
          className,
        )}
      >
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  // Eğer absolute URL ise next/image, relative ise basit img (Next/Image optimizasyon
  // remote pattern config gerektirir).
  const isExternal = /^https?:\/\//.test(src);

  if (isExternal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
