"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { getSettings } from "@/lib/queries/settings";
import {
  initializeCheckout,
  retrieveCheckout,
  type IyzicoCredentials,
} from "@/lib/iyzico/client";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export type CreatePaymentLinkResult =
  | {
      ok: true;
      paymentId: string;
      paymentLink: string; // iyzico hosted page
      expiresAt: Date;
      mode: "test" | "production";
    }
  | { ok: false; error: string };

/** Sipariş için iyzico Checkout Form başlat → ödeme linki üret. */
export async function createPaymentLinkAction(
  orderId: string,
): Promise<CreatePaymentLinkResult> {
  await requireSession();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      items: { include: { product: { include: { category: true } } } },
    },
  });
  if (!order) return { ok: false, error: "Sipariş bulunamadı" };

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    return {
      ok: false,
      error: `Bu sipariş için ödeme oluşturulamaz: ${order.status}`,
    };
  }

  // Aktif PENDING/AUTHORIZED Payment varsa link'i geri dön (idempotent)
  const existing = await db.payment.findFirst({
    where: { orderId, status: { in: ["PENDING", "AUTHORIZED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.paymentLink) {
    return {
      ok: true,
      paymentId: existing.id,
      paymentLink: existing.paymentLink,
      expiresAt: new Date(existing.createdAt.getTime() + 30 * 60 * 1000),
      mode: (await getSettings()).iyzicoMode === "production"
        ? "production"
        : "test",
    };
  }

  const settings = await getSettings();
  const credentials: IyzicoCredentials = {
    mode: settings.iyzicoMode === "production" ? "production" : "test",
    apiKey: settings.iyzicoApiKey,
    secretKey: settings.iyzicoSecretKey,
  };

  // Callback URL (Cloudflare tunnel veya gerçek domain)
  const callbackBase =
    settings.iyzicoCallbackUrl ||
    process.env.AUTH_URL ||
    "http://localhost:3000";
  const callbackUrl = `${callbackBase.replace(/\/$/, "")}/api/payments/iyzico/callback`;

  // Buyer bilgileri (customer'dan)
  const customer = order.customer;
  const nameParts = customer.name.trim().split(/\s+/);
  const buyerName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const buyerSurname = nameParts.length > 1 ? (nameParts.at(-1) ?? "—") : "—";

  const addr = customer.address as Record<string, string> | null;
  const buyerAddress = addr?.line1 || "Belirtilmemiş";
  const buyerCity = addr?.city || "İstanbul";

  const conversationId = `${orderId}-${Date.now().toString(36)}`;

  const initResult = await initializeCheckout(credentials, {
    conversationId,
    priceMinor: order.total,
    basketId: order.id,
    callbackUrl,
    buyer: {
      id: customer.id,
      name: buyerName,
      surname: buyerSurname,
      email: customer.email,
      phone: customer.phone || undefined,
      registrationAddress: buyerAddress,
      city: buyerCity,
      country: addr?.country || "Türkiye",
    },
    basketItems: order.items.map((it) => ({
      id: it.productId || it.id,
      name: it.name,
      category1: it.product?.category?.name || "Genel",
      priceMinor: it.total,
      itemType: "PHYSICAL",
    })),
  });

  if (initResult.status !== "success" || !initResult.paymentPageUrl) {
    // Failed init'i bile log'la
    await db.payment.create({
      data: {
        orderId: order.id,
        gateway: "iyzico",
        status: "FAILED",
        amountMinor: order.total,
        currency: "TRY",
        gatewayConversationId: conversationId,
        errorMessage:
          initResult.errorMessage || "Bilinmeyen iyzico hatası",
        rawInit: initResult.raw as never,
      },
    });
    return {
      ok: false,
      error:
        initResult.errorMessage ||
        `iyzico bağlantı hatası (${initResult.errorCode ?? "?"})`,
    };
  }

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      gateway: "iyzico",
      status: "PENDING",
      amountMinor: order.total,
      currency: "TRY",
      gatewayConversationId: conversationId,
      gatewayToken: initResult.token,
      paymentLink: initResult.paymentPageUrl,
      rawInit: initResult.raw as never,
    },
  });

  await recordActivity({
    action: "payment.link_created",
    entityType: "order",
    entityId: order.id,
    metadata: {
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      mode: credentials.mode,
      amountMinor: order.total,
    },
  });

  revalidatePath(`/admin/orders/${order.id}`);

  return {
    ok: true,
    paymentId: payment.id,
    paymentLink: initResult.paymentPageUrl,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    mode: credentials.mode,
  };
}

/** Callback handler tarafından çağrılır — token ile iyzico'ya sorgu. */
export async function finalizePaymentAction(input: {
  token: string;
  conversationId?: string;
}): Promise<{ ok: boolean; paymentId?: string; error?: string }> {
  // Bu action callback handler'dan çağrılır, session yok (public).
  // Verify: token ile DB'de payment var mı?
  const payment = await db.payment.findFirst({
    where: { gatewayToken: input.token, status: "PENDING" },
    include: { order: true },
  });
  if (!payment) {
    return { ok: false, error: "Bekleyen ödeme bulunamadı" };
  }

  const settings = await getSettings();
  const credentials: IyzicoCredentials = {
    mode: settings.iyzicoMode === "production" ? "production" : "test",
    apiKey: settings.iyzicoApiKey,
    secretKey: settings.iyzicoSecretKey,
  };

  const result = await retrieveCheckout(credentials, input.token);

  if (
    result.status === "success" &&
    result.paymentStatus === "SUCCESS"
  ) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "CAPTURED",
        gatewayPaymentId: result.paymentId,
        paidAt: new Date(),
        rawCallback: result.raw as never,
      },
    });

    // Sipariş PENDING ise CONFIRMED'a al
    if (payment.order.status === "PENDING") {
      await db.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });
    }

    await recordActivity({
      action: "payment.captured",
      entityType: "order",
      entityId: payment.orderId,
      metadata: {
        paymentId: payment.id,
        gatewayPaymentId: result.paymentId,
        amountMinor: payment.amountMinor,
      },
    });

    revalidatePath(`/admin/orders/${payment.orderId}`);
    revalidatePath("/admin/orders");
    return { ok: true, paymentId: payment.id };
  }

  // Başarısız
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      errorMessage:
        result.errorMessage ||
        `Ödeme ${result.paymentStatus ?? "başarısız"}`,
      rawCallback: result.raw as never,
    },
  });

  await recordActivity({
    action: "payment.failed",
    entityType: "order",
    entityId: payment.orderId,
    metadata: {
      paymentId: payment.id,
      reason: result.errorMessage || result.paymentStatus,
    },
  });

  revalidatePath(`/admin/orders/${payment.orderId}`);
  return {
    ok: false,
    error: result.errorMessage || "Ödeme başarısız",
  };
}

/** Settings'te iyzico ayarları. */
export async function updateIyzicoSettingsAction(input: {
  mode: "test" | "production";
  apiKey: string | null;
  secretKey: string | null;
  callbackUrl: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  await db.systemSettings.upsert({
    where: { id: "default" },
    update: {
      iyzicoMode: input.mode,
      iyzicoApiKey: input.apiKey,
      iyzicoSecretKey: input.secretKey,
      iyzicoCallbackUrl: input.callbackUrl,
    },
    create: {
      id: "default",
      iyzicoMode: input.mode,
      iyzicoApiKey: input.apiKey,
      iyzicoSecretKey: input.secretKey,
      iyzicoCallbackUrl: input.callbackUrl,
    },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
