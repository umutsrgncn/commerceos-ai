/**
 * Otopilot Çekirdek Motoru.
 *
 * Bu modül `db.systemSettings.autoPilotEnabled` ON iken çağrılan
 * action'ları (sipariş, yorum, stok, banka) AI ile otomatik karara
 * bağlar ve `AutoPilotAction` tablosuna her kararı yazar.
 *
 * Manuel akışı bozmaz — bu fonksiyonlar additive: kullanıcı zaten
 * manuel yapıyorsa otopilot devreye girmez.
 */

import "server-only";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

type AutoPilotSettings = {
  enabled: boolean;
  threshold: number; // 0-100
  autoReplyReviews: boolean;
  autoIssueInvoices: boolean;
  autoReorderStock: boolean;
};

async function getAutoPilotSettings(): Promise<AutoPilotSettings> {
  const s = await db.systemSettings.findUnique({
    where: { id: "default" },
    select: {
      autoPilotEnabled: true,
      autoPilotConfidenceThreshold: true,
      autoPilotAutoReplyReviews: true,
      autoPilotAutoIssueInvoices: true,
      autoPilotAutoReorderStock: true,
    },
  });
  return {
    enabled: s?.autoPilotEnabled ?? false,
    threshold: s?.autoPilotConfidenceThreshold ?? 75,
    autoReplyReviews: s?.autoPilotAutoReplyReviews ?? true,
    autoIssueInvoices: s?.autoPilotAutoIssueInvoices ?? true,
    autoReorderStock: s?.autoPilotAutoReorderStock ?? true,
  };
}

/** Yardımcı: AutoPilotAction kaydı oluştur. */
async function logAction(input: {
  type:
    | "REVIEW_REPLY"
    | "INVOICE_ISSUE"
    | "STOCK_REORDER"
    | "BANK_MATCH"
    | "ORDER_CONFIRM";
  triggerSource: string;
  triggerSummary: string;
  decision: string;
  reasoning?: string;
  confidence?: number;
  status?: "PENDING" | "EXECUTED" | "FAILED" | "SKIPPED";
  resultRef?: string;
  errorMessage?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.autoPilotAction.create({
    data: {
      type: input.type,
      triggerSource: input.triggerSource,
      triggerSummary: input.triggerSummary,
      decision: input.decision,
      reasoning: input.reasoning ?? null,
      confidence: input.confidence ?? null,
      status: input.status ?? "PENDING",
      resultRef: input.resultRef ?? null,
      errorMessage: input.errorMessage ?? null,
      metadata: input.metadata,
      executedAt:
        input.status === "EXECUTED" || input.status === "FAILED"
          ? new Date()
          : null,
    },
  });
}

// ─── 1) Otomatik yorum cevabı ───────────────────────────────────────────────

export async function autoReplyToReview(reviewId: string): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoReplyReviews) return;

  const review = await db.productReview.findUnique({
    where: { id: reviewId },
    include: { product: { select: { name: true } } },
  });
  if (!review) return;
  if (review.reply) return; // zaten cevap var

  const triggerSummary = `${review.product.name} — ${review.rating}/5: "${review.body.slice(0, 80)}"`;

  try {
    const res = await fetch(`${AI_BASE}/reviews/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: review.product.name,
        rating: review.rating,
        body: review.body,
        author_name: review.authorName,
      }),
    });

    if (!res.ok) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `review:${reviewId}`,
        triggerSummary,
        decision: "Cevap yazılamadı",
        status: "FAILED",
        errorMessage: `AI ${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const reply: string = data.text ?? data.reply ?? "";
    // Yıldıza göre default confidence: yüksek puanlı yorumlar daha güvenli
    const confidence: number =
      data.confidence ??
      (review.rating >= 4 ? 90 : review.rating === 3 ? 70 : 55);

    if (confidence < cfg.threshold || !reply) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `review:${reviewId}`,
        triggerSummary,
        decision: "Eşik altında — manuel onay öneriliyor",
        confidence,
        reasoning: data.reasoning ?? null,
        status: "SKIPPED",
        metadata: { generatedReply: reply },
      });
      return;
    }

    // Cevabı yaz
    await db.productReview.update({
      where: { id: reviewId },
      data: { reply, repliedAt: new Date() },
    });

    await logAction({
      type: "REVIEW_REPLY",
      triggerSource: `review:${reviewId}`,
      triggerSummary,
      decision: `Cevap yazıldı (${reply.length} karakter)`,
      reasoning: data.reasoning ?? null,
      confidence,
      status: "EXECUTED",
      resultRef: `review:${reviewId}`,
      metadata: { reply },
    });

    await recordActivity({
      action: "autopilot.review_reply",
      entityType: "review",
      entityId: reviewId,
      metadata: { confidence, replyPreview: reply.slice(0, 100) },
    });
  } catch (err) {
    await logAction({
      type: "REVIEW_REPLY",
      triggerSource: `review:${reviewId}`,
      triggerSummary,
      decision: "Sistem hatası",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : "unknown",
    });
  }
}

// ─── 2) Otomatik e-fatura kesimi ────────────────────────────────────────────

/** Sipariş CONFIRMED durumuna geçtiğinde ve henüz fatura yoksa AI kessin. */
export async function autoIssueInvoice(orderId: string): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoIssueInvoices) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { address: true, name: true } },
      invoice: { select: { id: true, status: true } },
    },
  });
  if (!order) return;

  // Henüz fatura yok ya da reddedilmiş
  if (order.invoice && order.invoice.status !== "REJECTED") return;
  // Sadece CONFIRMED veya üstü
  if (
    order.status !== "CONFIRMED" &&
    order.status !== "SHIPPED" &&
    order.status !== "DELIVERED"
  )
    return;

  const triggerSummary = `Sipariş ${order.orderNumber} CONFIRMED — fatura kesilmesi gerekiyor`;

  // Belge tipini AI değil deterministik karar ver: müşteri kurumsal mı?
  const addr = order.customer.address as Record<string, unknown> | null;
  const hasTaxId = addr && typeof addr.taxId === "string" && addr.taxId.length > 0;
  const documentType: "EFATURA" | "EARSIV" = hasTaxId ? "EFATURA" : "EARSIV";

  try {
    // Lazy import to avoid circular deps
    const { issueInvoiceAction } = await import("@/lib/actions/invoices");
    const r = await issueInvoiceAction(orderId, documentType);

    if (r.ok) {
      await logAction({
        type: "INVOICE_ISSUE",
        triggerSource: `order:${orderId}`,
        triggerSummary,
        decision: `${documentType === "EARSIV" ? "E-Arşiv" : "E-Fatura"} kesildi: ${r.invoiceNumber}`,
        reasoning: hasTaxId
          ? "Müşteri vergi kimlik numarası var → E-Fatura (B2B)"
          : "Bireysel müşteri → E-Arşiv (B2C)",
        confidence: 95,
        status: "EXECUTED",
        resultRef: `invoice:${r.invoiceId}`,
        metadata: { invoiceNumber: r.invoiceNumber, documentType, mode: r.mode },
      });
      await recordActivity({
        action: "autopilot.invoice_issued",
        entityType: "order",
        entityId: orderId,
        metadata: { invoiceNumber: r.invoiceNumber, documentType },
      });
    } else {
      await logAction({
        type: "INVOICE_ISSUE",
        triggerSource: `order:${orderId}`,
        triggerSummary,
        decision: "Fatura kesilemedi",
        status: "FAILED",
        errorMessage: r.error,
      });
    }
  } catch (err) {
    await logAction({
      type: "INVOICE_ISSUE",
      triggerSource: `order:${orderId}`,
      triggerSummary,
      decision: "Sistem hatası",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : "unknown",
    });
  }
}

// ─── 3) Otomatik stok yenileme ──────────────────────────────────────────────

const REORDER_THRESHOLD = 5; // 5 adet altına düşen stok için tetiklenir
const REORDER_TARGET = 50; // hedef adet (sipariş edilecek miktar)

export async function autoReorderStockIfLow(productId: string): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoReorderStock) return;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { inventory: true },
  });
  if (!product || !product.inventory) return;
  const qty = product.inventory.quantity;
  if (qty > REORDER_THRESHOLD) return; // henüz kritik değil

  const triggerSummary = `${product.name} stoğu kritik (${qty} adet)`;

  // Bu SKU'yu sağlayan aktif tedarikçi var mı?
  const supplier = await db.supplier.findFirst({
    where: { isActive: true, productSkus: { has: product.sku } },
  });

  if (!supplier) {
    await logAction({
      type: "STOCK_REORDER",
      triggerSource: `product:${productId}`,
      triggerSummary,
      decision: "Bu SKU'yu sağlayan tedarikçi bulunamadı",
      status: "SKIPPED",
      reasoning:
        "Tedarikçiler sayfasından bu SKU'yu sağlayan bir kayıt eklemen gerekiyor.",
    });
    return;
  }

  // Mevcut bekleyen reorder var mı? (idempotent)
  const existing = await db.autoPilotAction.findFirst({
    where: {
      type: "STOCK_REORDER",
      triggerSource: `product:${productId}`,
      status: "EXECUTED",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (existing) return; // son 24 saatte zaten reorder yapıldı

  // AI ile mail metni üret
  let mailSubject = `Sipariş: ${product.name} (${product.sku}) - ${REORDER_TARGET} adet`;
  let mailBody = `Merhaba ${supplier.contactPerson ?? supplier.name},\n\nStoğumuz ${qty} adete düştü. ${product.name} (SKU: ${product.sku}) için ${REORDER_TARGET} adet sipariş geçmek istiyoruz.\n\nLead time ${supplier.leadTimeDays ?? 7} gün olarak teyit ederseniz hemen onaylayalım.\n\nİyi çalışmalar.`;

  try {
    const aiRes = await fetch(`${AI_BASE}/messages/supplier-reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_name: supplier.name,
        contact_person: supplier.contactPerson,
        product_name: product.name,
        sku: product.sku,
        current_stock: qty,
        target_quantity: REORDER_TARGET,
        lead_time_days: supplier.leadTimeDays ?? 7,
      }),
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      if (data.subject) mailSubject = data.subject;
      if (data.body) mailBody = data.body;
    }
  } catch {
    // AI başarısız olursa template ile devam
  }

  // Mock SMTP: gerçekten mail göndermiyoruz, sadece logluyoruz
  await logAction({
    type: "STOCK_REORDER",
    triggerSource: `product:${productId}`,
    triggerSummary,
    decision: `${supplier.name} (${supplier.email ?? "—"}) → ${REORDER_TARGET} adet sipariş maili`,
    reasoning: `Stok ${qty} ≤ ${REORDER_THRESHOLD} (kritik eşik). Tedarikçide bu SKU mevcut, lead time ${supplier.leadTimeDays ?? 7} gün.`,
    confidence: 90,
    status: "EXECUTED",
    resultRef: `supplier:${supplier.id}`,
    metadata: {
      mailSubject,
      mailBody,
      supplierEmail: supplier.email,
      productSku: product.sku,
      currentQty: qty,
      orderedQty: REORDER_TARGET,
    },
  });

  await recordActivity({
    action: "autopilot.stock_reorder",
    entityType: "product",
    entityId: productId,
    metadata: {
      supplierName: supplier.name,
      productName: product.name,
      currentQty: qty,
      orderedQty: REORDER_TARGET,
    },
  });
}

// ─── 4) Banka eşleştirme threshold düşürücü ─────────────────────────────────

/** Otopilot ON iken bank match threshold'u kullanıcının ayarladığı eşiğe
 *  düşürülür. Çağıran kod (bank.ts tryAiMatch) bu fonksiyonu kullanabilir. */
export async function getBankMatchThreshold(): Promise<number> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled) return 85; // default
  return cfg.threshold;
}
