import { Package } from "lucide-react";
import { cn } from "@/lib/cn";

/** Picks the first image url out of a JSON column written by ImageUploader. */
function firstImage(images: unknown): string | null {
  if (!images) return null;
  if (Array.isArray(images)) {
    const first = images.find((u) => typeof u === "string" && u.length > 0);
    return typeof first === "string" ? first : null;
  }
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && typeof parsed[0] === "string"
        ? parsed[0]
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

interface ProductThumbProps {
  images: unknown;
  alt: string;
  /** Tailwind size class — default is h-10 w-10. */
  className?: string;
  /** Larger rounded corners look better at >= 64px. */
  rounded?: "md" | "lg" | "xl";
}

export function ProductThumb({
  images,
  alt,
  className,
  rounded = "md",
}: ProductThumbProps) {
  const url = firstImage(images);
  const radius =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (!url) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]",
          radius,
          className ?? "h-10 w-10"
        )}
      >
        <Package className="h-4 w-4" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn(
        "shrink-0 object-cover",
        radius,
        className ?? "h-10 w-10"
      )}
    />
  );
}
