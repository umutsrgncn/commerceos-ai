import { Badge } from "@/components/ui/badge";
import type { ProductStatusValue } from "@/lib/schemas/products";

const MAP: Record<ProductStatusValue, { label: string; variant: "neutral" | "success" | "warning" | "danger" }> = {
  DRAFT: { label: "Taslak", variant: "warning" },
  PUBLISHED: { label: "Yayında", variant: "success" },
  ARCHIVED: { label: "Arşiv", variant: "neutral" },
};

export function StatusBadge({ status }: { status: ProductStatusValue }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
