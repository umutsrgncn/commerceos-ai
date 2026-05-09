import "server-only";
import { db } from "@/lib/db";
import { getSettings } from "./settings";

export type ReceiptData = NonNullable<Awaited<ReturnType<typeof getReceiptData>>>;

export async function getReceiptData(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { sku: true } },
        },
      },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export type CompanyInfo = {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

/** Reads from the SystemSettings singleton (created lazily on first call). */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const settings = await getSettings();
  return {
    name: settings.companyName,
    taxId: settings.taxId,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
  };
}

export function formatAddress(
  address: unknown
): { lines: string[] } | null {
  if (!address || typeof address !== "object") return null;
  const a = address as Record<string, string | undefined>;
  const lines: string[] = [];
  if (a.line1) lines.push(a.line1);
  if (a.line2) lines.push(a.line2);
  const cityLine = [a.postalCode, a.city, a.state].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  return lines.length > 0 ? { lines } : null;
}
