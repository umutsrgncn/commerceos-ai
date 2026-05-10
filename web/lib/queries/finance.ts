import "server-only";
import { db } from "@/lib/db";
import { type ExpenseCategoryValue } from "@/lib/schemas/expenses";

export type ProfitLoss = {
  /** Gelir: tüm sipariş tutarları (CANCELLED hariç). */
  revenueGross: number;
  /** İade tutarları (Refund toplamı, COMPLETED + PENDING). */
  refunds: number;
  /** Net gelir = brüt gelir − iade. */
  revenueNet: number;
  /** Tüm gider toplamı. */
  expenseTotal: number;
  /** Brüt kâr = net gelir − COGS (eğer hiç değilse expenseTotal hariç). */
  netProfit: number;
  /** Kategori bazında gider dağılımı. */
  byCategory: Array<{
    category: ExpenseCategoryValue;
    amount: number;
    count: number;
  }>;
};

/**
 * Brüt gelir → iade çıkar → net gelir; ayrı olarak gider toplamı; net kâr.
 * Tüm değerler kuruş cinsinden TRY varsayar (TODO: çoklu para birimi normalize).
 */
export async function getProfitLoss(from: Date, to: Date): Promise<ProfitLoss> {
  const [revenueAgg, refundAgg, expenseAgg, byCategoryRaw] = await Promise.all([
    db.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    db.refund.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ["PENDING", "COMPLETED"] },
      },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    db.expense.groupBy({
      by: ["category"],
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const revenueGross = revenueAgg._sum.total ?? 0;
  const refunds = refundAgg._sum.amount ?? 0;
  const revenueNet = revenueGross - refunds;
  const expenseTotal = expenseAgg._sum.amount ?? 0;
  const netProfit = revenueNet - expenseTotal;

  return {
    revenueGross,
    refunds,
    revenueNet,
    expenseTotal,
    netProfit,
    byCategory: byCategoryRaw.map((b) => ({
      category: b.category as ExpenseCategoryValue,
      amount: b._sum.amount ?? 0,
      count: b._count._all,
    })),
  };
}

export type CashFlowPoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
  expense: number;
  net: number;
};

/** Son N gün için günlük gelir + gider + net (zero-fill). */
export async function getCashFlow(days = 30): Promise<CashFlowPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const [revenue, expense] = await Promise.all([
    db.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COALESCE(SUM(total), 0)::bigint AS total
      FROM "Order"
      WHERE "createdAt" >= ${since}
        AND status NOT IN ('CANCELLED')
      GROUP BY day
    `,
    db.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT
        date_trunc('day', date) AS day,
        COALESCE(SUM(amount), 0)::bigint AS total
      FROM "Expense"
      WHERE date >= ${since}
      GROUP BY day
    `,
  ]);

  const revMap = new Map(
    revenue.map((r) => [r.day.toISOString().slice(0, 10), Number(r.total)])
  );
  const expMap = new Map(
    expense.map((r) => [r.day.toISOString().slice(0, 10), Number(r.total)])
  );

  const out: CashFlowPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const rev = revMap.get(key) ?? 0;
    const exp = expMap.get(key) ?? 0;
    out.push({ date: key, revenue: rev, expense: exp, net: rev - exp });
  }
  return out;
}
