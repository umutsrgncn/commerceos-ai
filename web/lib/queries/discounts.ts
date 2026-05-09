import "server-only";
import { db } from "@/lib/db";

export async function listDiscounts() {
  return db.discount.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function getDiscountByCode(code: string) {
  return db.discount.findUnique({ where: { code: code.toUpperCase() } });
}

export type DiscountStatus = "scheduled" | "active" | "expired" | "disabled";

export function deriveStatus(d: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): DiscountStatus {
  if (!d.isActive) return "disabled";
  const now = Date.now();
  if (d.startsAt && d.startsAt.getTime() > now) return "scheduled";
  if (d.endsAt && d.endsAt.getTime() < now) return "expired";
  return "active";
}
