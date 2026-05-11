"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export const CARRIERS = [
  "ARAS",
  "YURTICI",
  "MNG",
  "PTT",
  "OTHER",
] as const;
export type Carrier = (typeof CARRIERS)[number];

export const CARRIER_LABELS: Record<Carrier, string> = {
  ARAS: "Aras Kargo",
  YURTICI: "Yurtiçi Kargo",
  MNG: "MNG Kargo",
  PTT: "PTT Kargo",
  OTHER: "Diğer",
};

/** Mock kargo "API" — gerçek entegrasyonda her firma kendi RPC formatını
 *  kullanır. Burada sadece tracking number üretip return ediyoruz. */
function generateTrackingNumber(carrier: Carrier): string {
  const prefix = carrier === "ARAS" ? "AK" : carrier === "YURTICI" ? "YK" : carrier.slice(0, 2);
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export type ShipResult =
  | { ok: true; trackingNumber: string; carrier: Carrier }
  | { ok: false; error: string };

/** Siparişi kargoya ver — carrier seç, tracking no üret, status SHIPPED. */
export async function shipOrderAction(input: {
  orderId: string;
  carrier: Carrier;
}): Promise<ShipResult> {
  await requireSession();

  const order = await db.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, status: true, orderNumber: true, trackingNumber: true },
  });
  if (!order) return { ok: false, error: "Sipariş bulunamadı" };
  if (order.trackingNumber) {
    return { ok: false, error: "Sipariş zaten kargoda" };
  }
  if (
    order.status !== "CONFIRMED" &&
    order.status !== "SHIPPED" &&
    order.status !== "PENDING"
  ) {
    return {
      ok: false,
      error: `Bu durumda kargolama yapılamaz: ${order.status}`,
    };
  }

  const tracking = generateTrackingNumber(input.carrier);
  const now = new Date();

  await db.order.update({
    where: { id: input.orderId },
    data: {
      carrier: input.carrier,
      trackingNumber: tracking,
      shippedAt: now,
      status: "SHIPPED",
    },
  });

  await recordActivity({
    action: "order.shipped",
    entityType: "order",
    entityId: input.orderId,
    metadata: {
      orderNumber: order.orderNumber,
      carrier: input.carrier,
      trackingNumber: tracking,
    },
  });

  revalidatePath(`/admin/orders/${input.orderId}`);
  revalidatePath("/admin/orders");

  return { ok: true, trackingNumber: tracking, carrier: input.carrier };
}

/** Siparişi teslim edildi olarak işaretle (kargo geri bildirim simülasyonu). */
export async function markDeliveredAction(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, orderNumber: true, trackingNumber: true },
  });
  if (!order) return { ok: false, error: "Sipariş bulunamadı" };
  if (order.status !== "SHIPPED") {
    return { ok: false, error: "Sadece SHIPPED siparişler teslim edilebilir" };
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  await recordActivity({
    action: "order.delivered",
    entityType: "order",
    entityId: orderId,
    metadata: {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

/** Mock takip linki — gerçek prodda kargo firmasının URL'ine yönlendirilir. */
export function getTrackingUrl(carrier: Carrier | null, tracking: string | null): string | null {
  if (!carrier || !tracking) return null;
  // Mock — gerçek URL'ler:
  // ARAS:    https://kargotakip.araskargo.com.tr/?code=
  // YURTICI: https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgulama?code=
  return `https://example.com/track/${carrier.toLowerCase()}/${tracking}`;
}
