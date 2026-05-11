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
  autoAnalyzeReviews: boolean;
  autoIssueInvoices: boolean;
  autoMatchBank: boolean;
  autoConfirmOrders: boolean;
  autoReorderStock: boolean;
  autoSuggestPrice: boolean;
  autoSegmentCustomers: boolean;
};

async function getAutoPilotSettings(): Promise<AutoPilotSettings> {
  const s = await db.systemSettings.findUnique({
    where: { id: "default" },
  });
  return {
    enabled: s?.autoPilotEnabled ?? false,
    threshold: s?.autoPilotConfidenceThreshold ?? 75,
    autoReplyReviews: s?.autoPilotAutoReplyReviews ?? true,
    autoAnalyzeReviews: s?.autoPilotAutoAnalyzeReviews ?? true,
    autoIssueInvoices: s?.autoPilotAutoIssueInvoices ?? true,
    autoMatchBank: s?.autoPilotAutoMatchBank ?? true,
    autoConfirmOrders: s?.autoPilotAutoConfirmOrders ?? false,
    autoReorderStock: s?.autoPilotAutoReorderStock ?? true,
    autoSuggestPrice: s?.autoPilotAutoSuggestPrice ?? false,
    autoSegmentCustomers: s?.autoPilotAutoSegmentCustomers ?? true,
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

// ─── 4) Banka eşleştirme threshold ──────────────────────────────────────────

/** Otopilot AÇIK + autoMatchBank ON iken eşik kullanıcının ayarladığı seviyeye
 *  düşer. Aksi halde 85% sabit. */
export async function getBankMatchThreshold(): Promise<number> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoMatchBank) return 85;
  return cfg.threshold;
}

// ─── 5) Yeni yorum geldiğinde negatif analiz/flag ───────────────────────────

export async function autoAnalyzeReview(reviewId: string): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoAnalyzeReviews) return;

  const review = await db.productReview.findUnique({
    where: { id: reviewId },
    include: { product: { select: { name: true } } },
  });
  if (!review) return;
  if (review.aiFlagged) return; // zaten flag'lı

  const triggerSummary = `${review.product.name} — ${review.rating}/5 yorum`;

  try {
    const res = await fetch(`${AI_BASE}/reviews/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviews: [
          {
            id: review.id,
            rating: review.rating,
            body: review.body,
            createdAt: review.createdAt.toISOString(),
          },
        ],
      }),
    });
    if (!res.ok) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `review:${reviewId}`,
        triggerSummary,
        decision: "Analiz başarısız",
        status: "FAILED",
        errorMessage: `AI ${res.status}`,
      });
      return;
    }

    const data = await res.json();
    // Analyze endpoint summary + sentiment + themes döndürür
    const sentiment: string =
      data.sentiment?.negative >= 50
        ? "negative"
        : data.sentiment?.positive >= 60
          ? "positive"
          : "neutral";
    const themes: string[] = data.themes ?? [];

    // Sadece negatif veya 3 yıldız altı → flag'la
    const shouldFlag =
      sentiment === "negative" || review.rating <= 2 ||
      themes.some((t) => /şikayet|kargo|iade|sorun/i.test(t));

    if (!shouldFlag) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `review:${reviewId}`,
        triggerSummary,
        decision: "Yorum analiz edildi, flag gerekmedi",
        status: "EXECUTED",
        reasoning: `Sentiment: ${sentiment}, themes: ${themes.join(", ")}`,
      });
      return;
    }

    const flagReason = themes[0] ?? (sentiment === "negative" ? "olumsuz" : "şikayet");

    await db.productReview.update({
      where: { id: reviewId },
      data: {
        aiFlagged: true,
        aiFlagReason: flagReason,
        aiFlagSentiment: sentiment,
      },
    });

    await logAction({
      type: "REVIEW_REPLY",
      triggerSource: `review:${reviewId}`,
      triggerSummary,
      decision: `Yorum flag'landı: ${flagReason}`,
      reasoning: data.summary ?? `Sentiment: ${sentiment}`,
      confidence: 88,
      status: "EXECUTED",
      resultRef: `review:${reviewId}`,
      metadata: { sentiment, themes, flagReason },
    });

    await recordActivity({
      action: "autopilot.review_flagged",
      entityType: "review",
      entityId: reviewId,
      metadata: { sentiment, flagReason },
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

// ─── 6) Havale eşleşince siparişi CONFIRMED'a al ────────────────────────────

export async function autoConfirmOrder(
  bankTxId: string,
  orderId: string,
): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoConfirmOrders) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, total: true },
  });
  if (!order) return;
  if (order.status !== "PENDING") return; // sadece PENDING'i CONFIRMED'a al

  const triggerSummary = `Havale eşleşti — ${order.orderNumber} CONFIRMED'a alınacak`;

  try {
    await db.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    await logAction({
      type: "ORDER_CONFIRM",
      triggerSource: `bank:${bankTxId}`,
      triggerSummary,
      decision: `Sipariş ${order.orderNumber} CONFIRMED`,
      reasoning:
        "Havale tutarı sipariş toplamıyla eşleşti, otopilot otomatik onayladı.",
      confidence: 90,
      status: "EXECUTED",
      resultRef: `order:${orderId}`,
      metadata: { orderNumber: order.orderNumber, total: order.total },
    });

    await recordActivity({
      action: "autopilot.order_confirmed",
      entityType: "order",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });

    // Artık CONFIRMED olduğu için otomatik fatura kesimi de tetiklenebilir
    await autoIssueInvoice(orderId);
  } catch (err) {
    await logAction({
      type: "ORDER_CONFIRM",
      triggerSource: `bank:${bankTxId}`,
      triggerSummary,
      decision: "Sistem hatası",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : "unknown",
    });
  }
}

// ─── 8) Haftalık fiyat önerisi tarayıcısı (manuel trigger) ──────────────────

/** Otopilot autoSuggestPrice ON ise, eski güncellemesi olmayan ürünlerde
 *  AI fiyat önerisi üretip AutoPilotAction'a SKIPPED status ile yazar.
 *  Onayı kullanıcı approval queue'dan verir. */
export async function runPriceSuggestionScan(input?: {
  productLimit?: number;
}): Promise<{ scanned: number; suggested: number; skipped: number }> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoSuggestPrice) {
    return { scanned: 0, suggested: 0, skipped: 0 };
  }

  const limit = input?.productLimit ?? 10;
  const products = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      costPrice: { not: null },
      updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let suggested = 0;
  let skipped = 0;

  for (const p of products) {
    try {
      const res = await fetch(`${AI_BASE}/pricing/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: p.id }),
      });
      if (!res.ok) {
        skipped++;
        continue;
      }
      const data = await res.json();
      if (!data.ok || data.action === "hold") {
        skipped++;
        continue;
      }

      await logAction({
        type: "STOCK_REORDER",
        triggerSource: `product:${p.id}`,
        triggerSummary: `${p.name} fiyat önerisi`,
        decision: `${data.action === "increase" ? "↑" : "↓"} ${(data.suggested_price_minor / 100).toFixed(2)} TL`,
        reasoning: data.reasoning ?? null,
        confidence: data.confidence ?? 70,
        status: "SKIPPED", // manuel onaya bırak
        metadata: {
          productId: p.id,
          productName: p.name,
          currentPriceMinor: data.current_price_minor,
          suggestedPriceMinor: data.suggested_price_minor,
          action: data.action,
          forApproval: true,
        },
      });
      suggested++;
    } catch {
      skipped++;
    }
  }

  await recordActivity({
    action: "autopilot.price_scan",
    metadata: {
      scanned: products.length,
      suggested,
      skipped,
    },
  });

  return { scanned: products.length, suggested, skipped };
}

// ─── 7) Yeni müşteri eklenince AI segment ───────────────────────────────────

export async function autoSegmentCustomer(customerId: string): Promise<void> {
  const cfg = await getAutoPilotSettings();
  if (!cfg.enabled || !cfg.autoSegmentCustomers) return;

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true, aiSegment: true },
  });
  if (!customer) return;
  if (customer.aiSegment) return; // zaten segmentli

  const triggerSummary = `${customer.name} segmentlenecek`;

  try {
    const res = await fetch(`${AI_BASE}/customers/segment-by-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });
    if (!res.ok) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `customer:${customerId}`,
        triggerSummary,
        decision: "Segment alınamadı",
        status: "FAILED",
        errorMessage: `AI ${res.status}`,
      });
      return;
    }

    const data = await res.json();
    const segment: string = data.segment ?? "yeni";
    const confidence: number = data.confidence ?? 70;

    if (confidence < cfg.threshold) {
      await logAction({
        type: "REVIEW_REPLY",
        triggerSource: `customer:${customerId}`,
        triggerSummary,
        decision: "Eşik altında — manuel onay öneriliyor",
        confidence,
        status: "SKIPPED",
        metadata: { suggestedSegment: segment },
      });
      return;
    }

    await db.customer.update({
      where: { id: customerId },
      data: {
        aiSegment: segment,
        aiSegmentConfidence: confidence,
        aiSegmentUpdatedAt: new Date(),
      },
    });

    await logAction({
      type: "REVIEW_REPLY",
      triggerSource: `customer:${customerId}`,
      triggerSummary,
      decision: `Segment: ${segment}`,
      reasoning: data.reasoning ?? null,
      confidence,
      status: "EXECUTED",
      resultRef: `customer:${customerId}`,
      metadata: { segment, actions: data.actions },
    });

    await recordActivity({
      action: "autopilot.customer_segmented",
      entityType: "customer",
      entityId: customerId,
      metadata: { segment, confidence },
    });
  } catch (err) {
    await logAction({
      type: "REVIEW_REPLY",
      triggerSource: `customer:${customerId}`,
      triggerSummary,
      decision: "Sistem hatası",
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : "unknown",
    });
  }
}
