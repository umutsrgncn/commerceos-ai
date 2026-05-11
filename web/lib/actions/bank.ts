"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { recordActivity } from "@/lib/activity";
import { getSettings } from "@/lib/queries/settings";
import {
  applyMapping,
  parseCsv,
  type ColumnMapping,
  type ParsedTransaction,
} from "@/lib/bank/csv";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const AUTO_MATCH_THRESHOLD = 85;

async function requireSession() {
  return requireRole("MANAGER");
}

export type ImportPreview = {
  ok: true;
  totalRows: number;
  validCount: number;
  errors: { rowIndex: number; reason: string }[];
  sample: ParsedTransaction[];
  delimiter: string;
  headers: string[];
};

export type ImportResult =
  | {
      ok: true;
      imported: number;
      autoMatched: number;
      skipped: number;
    }
  | { ok: false; error: string };

/** CSV içeriğini parse + mapping uygula → DB'ye yaz + her tx için AI match dene. */
export async function importBankCsvAction(input: {
  csvText: string;
  bankName: string;
  accountIban?: string;
  mapping: ColumnMapping;
}): Promise<ImportResult> {
  await requireSession();

  const parsed = parseCsv(input.csvText);
  const { ok: rows, errors } = applyMapping(parsed, input.mapping);

  if (rows.length === 0) {
    return {
      ok: false,
      error: `Hiç geçerli satır bulunamadı (${errors.length} hatalı satır).`,
    };
  }

  let imported = 0;
  let autoMatched = 0;
  let skipped = 0;

  for (const tx of rows) {
    // Aynı tx (banka + ref) varsa atla
    if (tx.reference) {
      const existing = await db.bankTransaction.findUnique({
        where: {
          bankName_reference: {
            bankName: input.bankName,
            reference: tx.reference,
          },
        },
      });
      if (existing) {
        skipped++;
        continue;
      }
    }

    const direction = tx.amountMinor > 0 ? "IN" : "OUT";

    const created = await db.bankTransaction.create({
      data: {
        bankName: input.bankName,
        accountIban: input.accountIban || null,
        reference: tx.reference,
        transactionDate: tx.transactionDate,
        amountMinor: tx.amountMinor,
        description: tx.description,
        direction,
        source: "CSV",
        status: "UNMATCHED",
        rawData: tx.rawRow as Prisma.InputJsonValue,
      },
    });
    imported++;

    // Sadece IN (gelen havale) için AI eşleştirme dene
    if (direction === "IN") {
      const matched = await tryAiMatch(created.id);
      if (matched) autoMatched++;
    }
  }

  await recordActivity({
    action: "bank.import",
    entityType: "bank",
    entityId: input.bankName,
    metadata: {
      bankName: input.bankName,
      imported,
      autoMatched,
      skipped,
      errors: errors.length,
    },
  });

  revalidatePath("/admin/bank");
  return { ok: true, imported, autoMatched, skipped };
}

/** Tek bir tx için AI service çağırıp confidence ≥85 ise otomatik eşleştir.
 *  true döner: otomatik eşleşti / false: eşleşmedi veya threshold altında. */
export async function tryAiMatch(bankTxId: string): Promise<boolean> {
  const tx = await db.bankTransaction.findUnique({ where: { id: bankTxId } });
  if (!tx) return false;
  if (tx.status !== "UNMATCHED") return false;
  if (tx.direction !== "IN") return false; // sadece gelen havale

  try {
    const res = await fetch(`${AI_BASE}/bank/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_date: tx.transactionDate.toISOString(),
        amount_minor: tx.amountMinor,
        description: tx.description,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const orderId: string | null = data.matched_order_id ?? null;
    const confidence: number = data.confidence ?? 0;
    const reasoning: string = data.reasoning ?? "";

    // Otopilot ON + autoMatchBank ise threshold settings'ten alınır,
    // değilse default 85% (AUTO_MATCH_THRESHOLD).
    const { getBankMatchThreshold, autoConfirmOrder } = await import(
      "@/lib/autopilot/core"
    );
    const dynamicThreshold = await getBankMatchThreshold();

    if (orderId && confidence >= dynamicThreshold) {
      await db.bankTransaction.update({
        where: { id: bankTxId },
        data: {
          matchedOrderId: orderId,
          status: "AUTO_MATCHED",
          matchConfidence: confidence,
          matchReasoning: reasoning,
          matchedAt: new Date(),
          matchedBy: "AI",
        },
      });
      await recordActivity({
        action: "bank.matched",
        entityType: "order",
        entityId: orderId,
        metadata: {
          bankTxId,
          amountMinor: tx.amountMinor,
          confidence,
          reasoning,
          auto: true,
          threshold: dynamicThreshold,
        },
      });

      // Otopilot autoConfirmOrders ON ise siparişi CONFIRMED'a al
      try {
        await autoConfirmOrder(bankTxId, orderId);
      } catch {
        // sessizce devam
      }

      return true;
    } else if (orderId) {
      // Önerildi ama threshold altı — önerilen orderId'yi sakla, status UNMATCHED kal
      await db.bankTransaction.update({
        where: { id: bankTxId },
        data: {
          matchConfidence: confidence,
          matchReasoning: reasoning,
          // matchedOrderId KASITLI olarak yazılmaz: kullanıcı görsün
        },
      });
    }
    return false;
  } catch (err) {
    console.error("AI match error:", err);
    return false;
  }
}

/** Bir tx'i kullanıcının seçtiği siparişle manuel olarak eşleştir. */
export async function linkBankTxAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const bankTxId = formData.get("bankTxId");
  const orderId = formData.get("orderId");
  if (typeof bankTxId !== "string" || typeof orderId !== "string") {
    return { ok: false, error: "Geçersiz parametre" };
  }

  const tx = await db.bankTransaction.findUnique({ where: { id: bankTxId } });
  if (!tx) return { ok: false, error: "Tx bulunamadı" };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Sipariş bulunamadı" };

  await db.bankTransaction.update({
    where: { id: bankTxId },
    data: {
      matchedOrderId: orderId,
      status: "MANUAL_MATCHED",
      matchedAt: new Date(),
      matchedBy: `USER:${session.user!.id}`,
    },
  });
  await recordActivity({
    action: "bank.matched",
    entityType: "order",
    entityId: orderId,
    metadata: {
      bankTxId,
      amountMinor: tx.amountMinor,
      auto: false,
    },
  });

  revalidatePath("/admin/bank");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Eşleşmeyi kaldır (yanlış eşleşme düzeltme). */
export async function unlinkBankTxAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  const bankTxId = formData.get("bankTxId");
  if (typeof bankTxId !== "string") {
    return { ok: false, error: "Geçersiz parametre" };
  }

  const tx = await db.bankTransaction.findUnique({ where: { id: bankTxId } });
  if (!tx) return { ok: false, error: "Tx bulunamadı" };

  await db.bankTransaction.update({
    where: { id: bankTxId },
    data: {
      matchedOrderId: null,
      status: "UNMATCHED",
      matchedAt: null,
      matchedBy: null,
    },
  });

  revalidatePath("/admin/bank");
  if (tx.matchedOrderId) {
    revalidatePath(`/admin/orders/${tx.matchedOrderId}`);
  }
  return { ok: true };
}

/** "Alakasız" işaretle (komisyon, banka transferi vb.). */
export async function ignoreBankTxAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  const bankTxId = formData.get("bankTxId");
  if (typeof bankTxId !== "string") {
    return { ok: false, error: "Geçersiz parametre" };
  }
  await db.bankTransaction.update({
    where: { id: bankTxId },
    data: { status: "IGNORED" },
  });
  revalidatePath("/admin/bank");
  return { ok: true };
}

/** Mock simülatör: kullanıcı UI'dan fake havale gönderir, kendi webhook'umuza
 *  POST atar (production-ready arch demo). HMAC secret yoksa sade insert. */
export async function simulateBankTransferAction(input: {
  amountMinor: number;
  description: string;
  customerName?: string;
}): Promise<{ ok: true; bankTxId: string } | { ok: false; error: string }> {
  await requireSession();
  if (input.amountMinor <= 0) {
    return { ok: false, error: "Tutar pozitif olmalı" };
  }

  const settings = await getSettings();
  const ref = `SIM-${Date.now().toString(36).toUpperCase()}`;
  const desc = input.customerName
    ? `${input.customerName} ${input.description}`.trim()
    : input.description;

  const created = await db.bankTransaction.create({
    data: {
      bankName: settings.bankName ?? "Test Bankası",
      accountIban: settings.bankAccountIban,
      reference: ref,
      transactionDate: new Date(),
      amountMinor: input.amountMinor,
      description: desc || "Simülatör test havalesi",
      direction: "IN",
      source: "WEBHOOK",
      status: "UNMATCHED",
      rawData: { simulator: true, ...input } as Prisma.InputJsonValue,
    },
  });

  await tryAiMatch(created.id);
  revalidatePath("/admin/bank");
  return { ok: true, bankTxId: created.id };
}
