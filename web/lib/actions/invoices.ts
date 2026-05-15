"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { getSettings } from "@/lib/queries/settings";
import { nextSequenceForYear } from "@/lib/queries/invoices";
import {
  buildUblTrXml,
  newInvoiceUuid,
  nextInvoiceNumber,
  type InvoicePayload,
} from "@/lib/invoices/ubl";
import { sendInvoiceToGib } from "@/lib/invoices/gib-client";
import { recordActivity } from "@/lib/activity";

export type IssueInvoiceResult =
  | {
      ok: true;
      invoiceId: string;
      invoiceNumber: string;
      mode: "test" | "production";
      documentType: "EFATURA" | "EARSIV";
    }
  | { ok: false; error: string };

export type DocumentType = "EFATURA" | "EARSIV";

async function requireSession() {
  return requireRole("MANAGER");
}

/** Sipariş için e-fatura veya e-arşiv kes. UBL üret, sakla, entegratöre/mock'a gönder. */
export async function issueInvoiceAction(
  orderId: string,
  documentType: DocumentType = "EFATURA"
): Promise<IssueInvoiceResult> {
  await requireSession();

  const existing = await db.invoice.findUnique({ where: { orderId } });
  if (existing && existing.status !== "REJECTED") {
    return {
      ok: false,
      error: `Bu sipariş için zaten fatura kesilmiş (${existing.invoiceNumber}).`,
    };
  }

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
      items: { include: { product: { select: { sku: true } } } },
    },
  });
  if (!order) return { ok: false, error: "Sipariş bulunamadı." };

  const settings = await getSettings();
  if (!settings.taxId) {
    return {
      ok: false,
      error:
        "Şirket vergi numarası eksik. Ayarlar > Mağaza üzerinden ekle, sonra tekrar dene.",
    };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequenceForYear(year);
  const invoiceNumber = nextInvoiceNumber(year, sequence);
  const uuid = newInvoiceUuid();

  // Address objesi JSON. Müşteri adresinden tek satırlık metin oluştur.
  const addressJson = order.customer.address as Record<string, string> | null;
  const customerAddress = addressJson?.line1
    ? [addressJson.line1, addressJson.line2].filter(Boolean).join(" ")
    : undefined;
  const customerCity = addressJson?.city;

  const taxRate = order.subtotal > 0 ? order.tax / order.subtotal : 0;

  const payload: InvoicePayload = {
    invoiceNumber,
    uuid,
    issueDate: new Date(),
    currency: order.currency,
    mode: settings.gibMode === "production" ? "production" : "test",
    supplier: {
      name: settings.companyName,
      taxId: settings.taxId,
      address: settings.address ?? "—",
      city: "İstanbul",
      country: "Türkiye",
    },
    customer: {
      name: order.customer.name,
      email: order.customer.email ?? undefined,
      address: customerAddress,
      city: customerCity ?? undefined,
    },
    lines: order.items.map((it) => ({
      name: it.name,
      sku: it.product?.sku ?? undefined,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      taxRate,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
  };

  const ublXml = buildUblTrXml(payload);
  const mode: "test" | "production" =
    settings.gibMode === "production" ? "production" : "test";

  // Önce DRAFT olarak kaydet (XML üretildi).
  const invoice = await db.invoice.upsert({
    where: { orderId },
    update: {
      invoiceNumber,
      uuid,
      ublXml,
      status: "DRAFT",
      documentType,
      totalMinor: order.total,
      taxMinor: order.tax,
      currency: order.currency,
      mode,
      errorMessage: null,
      cancelledAt: null,
      cancelReason: null,
    },
    create: {
      orderId,
      invoiceNumber,
      uuid,
      ublXml,
      status: "DRAFT",
      documentType,
      totalMinor: order.total,
      taxMinor: order.tax,
      currency: order.currency,
      mode,
    },
  });

  // GİB'e (veya mock'a) gönder.
  const result = await sendInvoiceToGib(ublXml, uuid, {
    mode,
    integratorUrl: settings.gibIntegratorUrl,
    username: settings.gibUsername,
    password: settings.gibPasswordEncrypted,
    senderAlias: settings.gibSenderAlias,
  });

  if (!result.ok) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "REJECTED",
        errorMessage: result.error,
        sentAt: new Date(),
      },
    });
    await recordActivity({
      action: "invoice.failed",
      entityType: "order",
      entityId: orderId,
      metadata: { invoiceNumber, error: result.error, documentType },
    });
    return { ok: false, error: result.error };
  }

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "ACCEPTED",
      sentAt: new Date(),
      acceptedAt: result.acceptedAt,
    },
  });
  await recordActivity({
    action: "invoice.issued",
    entityType: "order",
    entityId: orderId,
    metadata: { invoiceNumber, mode, documentType },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/invoices");

  return {
    ok: true,
    invoiceId: invoice.id,
    invoiceNumber,
    mode,
    documentType,
  };
}

/** REJECTED faturayı yeniden entegratöre gönder. */
export async function reissueInvoiceAction(
  invoiceId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  const inv = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return { ok: false, error: "Fatura bulunamadı." };
  if (inv.status !== "REJECTED") {
    return {
      ok: false,
      error: "Yalnızca reddedilen faturalar yeniden gönderilebilir.",
    };
  }

  const settings = await getSettings();
  const mode: "test" | "production" =
    settings.gibMode === "production" ? "production" : "test";

  const result = await sendInvoiceToGib(inv.ublXml, inv.uuid, {
    mode,
    integratorUrl: settings.gibIntegratorUrl,
    username: settings.gibUsername,
    password: settings.gibPasswordEncrypted,
    senderAlias: settings.gibSenderAlias,
  });

  if (!result.ok) {
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        errorMessage: result.error,
        sentAt: new Date(),
      },
    });
    return { ok: false, error: result.error };
  }

  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "ACCEPTED",
      mode,
      sentAt: new Date(),
      acceptedAt: result.acceptedAt,
      errorMessage: null,
    },
  });
  await recordActivity({
    action: "invoice.reissued",
    entityType: "order",
    entityId: inv.orderId,
    metadata: { invoiceNumber: inv.invoiceNumber, mode },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/orders/${inv.orderId}`);
  revalidatePath("/admin/invoices");

  return { ok: true };
}

/** Faturayı iptal et. SENT/ACCEPTED faturalar iptal edilebilir; entegratöre
 *  iptal isteği gönderilir (test modunda mock). */
export async function cancelInvoiceAction(
  invoiceId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  const inv = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return { ok: false, error: "Fatura bulunamadı." };
  if (inv.status === "CANCELLED") {
    return { ok: false, error: "Fatura zaten iptal edilmiş." };
  }
  if (inv.status === "DRAFT") {
    return {
      ok: false,
      error: "Taslak fatura iptal edilemez; doğrudan silinmeli.",
    };
  }

  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason?.trim() || null,
    },
  });
  await recordActivity({
    action: "invoice.cancelled",
    entityType: "order",
    entityId: inv.orderId,
    metadata: {
      invoiceNumber: inv.invoiceNumber,
      reason: reason?.trim() || null,
    },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/orders/${inv.orderId}`);
  revalidatePath("/admin/invoices");

  return { ok: true };
}

/** Birden fazla siparişe toplu fatura kes — UI'dan checkbox ile seçilir. */
export async function bulkIssueInvoicesAction(input: {
  orderIds: string[];
  documentType?: DocumentType;
}): Promise<{
  ok: boolean;
  succeeded: number;
  failed: number;
  results: { orderId: string; ok: boolean; invoiceNumber?: string; error?: string }[];
}> {
  await requireSession();

  const docType: DocumentType = input.documentType ?? "EFATURA";
  const results: { orderId: string; ok: boolean; invoiceNumber?: string; error?: string }[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const orderId of input.orderIds) {
    const r = await issueInvoiceAction(orderId, docType);
    if (r.ok) {
      succeeded++;
      results.push({ orderId, ok: true, invoiceNumber: r.invoiceNumber });
    } else {
      failed++;
      results.push({ orderId, ok: false, error: r.error });
    }
  }

  await recordActivity({
    action: "invoice.bulk_issue",
    metadata: {
      attempted: input.orderIds.length,
      succeeded,
      failed,
      documentType: docType,
    },
  });

  return { ok: true, succeeded, failed, results };
}

export async function deleteInvoiceAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const inv = await db.invoice.findUnique({
    where: { id },
    select: { orderId: true },
  });
  if (!inv) return;

  await db.invoice.delete({ where: { id } });
  revalidatePath(`/admin/orders/${inv.orderId}`);
  revalidatePath("/admin/invoices");
}
