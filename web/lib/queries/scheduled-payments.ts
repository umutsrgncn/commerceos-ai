import "server-only";
import { db } from "@/lib/db";
import type { RecurrenceRule, ScheduledPayment } from "@prisma/client";

export type ScheduledPaymentOccurrence = {
  date: Date;
  paymentId: string;
  name: string;
  amount: number;
  category: ScheduledPayment["category"];
  vendor: string | null;
  recurrence: RecurrenceRule;
};

export async function listScheduledPayments(): Promise<ScheduledPayment[]> {
  return db.scheduledPayment.findMany({
    orderBy: [{ active: "desc" }, { startDate: "asc" }],
  });
}

export async function getScheduledPaymentById(id: string) {
  return db.scheduledPayment.findUnique({ where: { id } });
}

export async function activeScheduledPayments(): Promise<ScheduledPayment[]> {
  return db.scheduledPayment.findMany({
    where: { active: true },
    orderBy: { startDate: "asc" },
  });
}

/**
 * Bir ScheduledPayment'tan, verilen `from..to` aralığında düşen tüm ödeme
 * tarihlerini üret. Recurrence kuralına göre genişler, endDate sonrası
 * keser. Tek-seferlikse sadece startDate dönderir.
 */
export function expandOccurrences(
  p: ScheduledPayment,
  from: Date,
  to: Date,
): Date[] {
  if (to < from) return [];
  const out: Date[] = [];

  const start = new Date(p.startDate);
  const limit = p.endDate ? new Date(Math.min(p.endDate.getTime(), to.getTime())) : to;

  if (p.recurrence === "ONE_TIME") {
    if (start >= from && start <= limit) out.push(new Date(start));
    return out;
  }

  // Üretim güvenliği: en fazla 800 iterasyon (yıllık × ~2 yıl)
  let cursor = new Date(start);
  // İlk tarih `from`'dan önceyse, ileri sıçra
  while (cursor < from) {
    cursor = advance(cursor, p.recurrence, p.dueDay);
    if (cursor.getFullYear() > limit.getFullYear() + 1) return out;
  }

  let i = 0;
  while (cursor <= limit && i < 800) {
    if (cursor >= from) {
      out.push(new Date(cursor));
    }
    cursor = advance(cursor, p.recurrence, p.dueDay);
    i++;
  }
  return out;
}

function advance(d: Date, rule: RecurrenceRule, dueDay: number): Date {
  const next = new Date(d);
  switch (rule) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      next.setDate(clampDay(dueDay, next));
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      next.setDate(clampDay(dueDay, next));
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      next.setDate(clampDay(dueDay, next));
      break;
    case "ONE_TIME":
      // shouldn't happen — caller handles ONE_TIME directly
      next.setDate(next.getDate() + 1);
      break;
  }
  return next;
}

// Ayın gün sayısını aşmayacak şekilde sabitle (örn. dueDay=31 → Şubat'ta 28/29)
function clampDay(dueDay: number, target: Date): number {
  if (dueDay <= 0) return 1;
  const lastOfMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return Math.min(dueDay, lastOfMonth);
}

/**
 * Verilen aralıkta tüm aktif scheduled payment'ların occurrence'larını
 * tek listede topla. AI/forecast/UI takvim görünümü kullanır.
 */
export async function listUpcomingOccurrences(
  from: Date,
  to: Date,
): Promise<ScheduledPaymentOccurrence[]> {
  const payments = await activeScheduledPayments();
  const out: ScheduledPaymentOccurrence[] = [];
  for (const p of payments) {
    const dates = expandOccurrences(p, from, to);
    for (const d of dates) {
      out.push({
        date: d,
        paymentId: p.id,
        name: p.name,
        amount: p.amount,
        category: p.category,
        vendor: p.vendor,
        recurrence: p.recurrence,
      });
    }
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

/** Sonraki N gün için toplam scheduled ödeme (kuruş). */
export async function totalScheduledNextDays(days: number): Promise<number> {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + days);
  const occ = await listUpcomingOccurrences(now, to);
  return occ.reduce((s, o) => s + o.amount, 0);
}
