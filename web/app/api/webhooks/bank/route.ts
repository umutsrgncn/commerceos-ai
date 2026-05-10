import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSettings } from "@/lib/queries/settings";
import { tryAiMatch } from "@/lib/actions/bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Banka webhook endpoint'i.
 *
 * Production: BDDK lisanslı bankanın push event'leri buraya düşer.
 * Test: simülatör veya integration test'leri tetikler.
 *
 * Header `X-Bank-Signature: sha256=<hex>` HMAC ile body imzalanmış olmalı
 * (settings.bankWebhookSecret ile). Secret yoksa testte imza atlanır.
 *
 * Beklenen JSON body:
 *   {
 *     "bank_name": "Test Bankası",
 *     "iban": "TR...",
 *     "reference": "REF-123",
 *     "transaction_date": "2026-05-09T14:30:00Z",
 *     "amount_minor": 123456,            // pozitif IN, negatif OUT
 *     "currency": "TRY",
 *     "description": "ORD-X ödemesi"
 *   }
 */
export async function POST(req: Request) {
  const settings = await getSettings();
  const rawBody = await req.text();

  // İmza doğrulama (secret tanımlıysa)
  if (settings.bankWebhookSecret) {
    const sigHeader = req.headers.get("x-bank-signature") ?? "";
    const expected =
      "sha256=" +
      createHmac("sha256", settings.bankWebhookSecret)
        .update(rawBody)
        .digest("hex");
    const a = Buffer.from(sigHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 },
      );
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bankName = String(payload.bank_name ?? settings.bankName ?? "Bilinmeyen");
  const reference =
    typeof payload.reference === "string" ? payload.reference : null;
  const dateStr = String(payload.transaction_date ?? "");
  const amount = Number(payload.amount_minor);
  const description = String(payload.description ?? "");
  const currency = String(payload.currency ?? "TRY");
  const iban = typeof payload.iban === "string" ? payload.iban : null;

  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json(
      { ok: false, error: "Invalid amount_minor" },
      { status: 400 },
    );
  }
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid transaction_date" },
      { status: 400 },
    );
  }

  // Idempotent: aynı bank+reference varsa güncelleme yapmadan dön
  if (reference) {
    const existing = await db.bankTransaction.findUnique({
      where: { bankName_reference: { bankName, reference } },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        bankTxId: existing.id,
        idempotent: true,
      });
    }
  }

  const created = await db.bankTransaction.create({
    data: {
      bankName,
      accountIban: iban,
      reference,
      transactionDate: date,
      amountMinor: amount,
      currency,
      description,
      direction: amount > 0 ? "IN" : "OUT",
      source: "WEBHOOK",
      status: "UNMATCHED",
      rawData: payload as never,
    },
  });

  // AI eşleştirme (sadece IN için)
  if (amount > 0) {
    await tryAiMatch(created.id);
  }

  return NextResponse.json({ ok: true, bankTxId: created.id });
}
