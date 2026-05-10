import "server-only";
import { db } from "@/lib/db";

/** YYYY-MM string (TR locale ay başlangıç). */
export function currentPeriod(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getGoal(period: string) {
  return db.salesGoal.findUnique({ where: { period } });
}

export async function getCurrentMonthRevenue(): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const result = await db.order.aggregate({
    where: {
      createdAt: { gte: start, lt: end },
      status: { not: "CANCELLED" },
    },
    _sum: { total: true },
  });
  return result._sum.total ?? 0;
}

/** Geçmiş N ay için aylık gelir, AI hedef önerisi için */
export async function getMonthlyRevenueHistory(months = 6): Promise<
  Array<{ period: string; revenue: number }>
> {
  const out: Array<{ period: string; revenue: number }> = [];
  const now = new Date();
  for (let i = months; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const result = await db.order.aggregate({
      where: {
        createdAt: { gte: d, lt: next },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    });
    out.push({
      period: currentPeriod(d),
      revenue: result._sum.total ?? 0,
    });
  }
  return out;
}
