import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function listBankTransactions(filters: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  direction?: string;
} = {}) {
  const { page = 1, pageSize = 30, q, status, direction } = filters;
  const ands: Prisma.BankTransactionWhereInput[] = [];
  if (q) {
    ands.push({
      OR: [
        { description: { contains: q, mode: "insensitive" } },
        { bankName: { contains: q, mode: "insensitive" } },
        { reference: { contains: q, mode: "insensitive" } },
        { matchedOrder: { orderNumber: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (
    status &&
    ["UNMATCHED", "AUTO_MATCHED", "MANUAL_MATCHED", "IGNORED"].includes(status)
  ) {
    ands.push({ status: status as Prisma.BankTransactionWhereInput["status"] });
  }
  if (direction && ["IN", "OUT"].includes(direction)) {
    ands.push({
      direction: direction as Prisma.BankTransactionWhereInput["direction"],
    });
  }
  const where: Prisma.BankTransactionWhereInput = ands.length
    ? { AND: ands }
    : {};

  const [items, total] = await Promise.all([
    db.bankTransaction.findMany({
      where,
      include: {
        matchedOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { transactionDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.bankTransaction.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getBankTransactionById(id: string) {
  return db.bankTransaction.findUnique({
    where: { id },
    include: {
      matchedOrder: {
        include: {
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });
}

export async function getBankStats(filters: { q?: string } = {}) {
  const { q } = filters;
  const where: Prisma.BankTransactionWhereInput = q
    ? {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { bankName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [byStatus, monthInflow] = await Promise.all([
    db.bankTransaction.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { amountMinor: true },
    }),
    db.bankTransaction.aggregate({
      where: {
        ...where,
        direction: "IN",
        transactionDate: { gte: monthStart },
      },
      _sum: { amountMinor: true },
      _count: { _all: true },
    }),
  ]);

  const map = Object.fromEntries(
    byStatus.map((r) => [
      r.status,
      {
        count: r._count._all,
        sum: r._sum.amountMinor ?? 0,
      },
    ]),
  );

  const total = byStatus.reduce((sum, r) => sum + r._count._all, 0);
  const matched =
    (map.AUTO_MATCHED?.count ?? 0) + (map.MANUAL_MATCHED?.count ?? 0);
  const unmatched = map.UNMATCHED?.count ?? 0;
  const ignored = map.IGNORED?.count ?? 0;

  return {
    total,
    matched,
    unmatched,
    ignored,
    autoMatched: map.AUTO_MATCHED?.count ?? 0,
    manualMatched: map.MANUAL_MATCHED?.count ?? 0,
    monthInflowMinor: monthInflow._sum.amountMinor ?? 0,
    monthInflowCount: monthInflow._count._all,
    matchRate: total > 0 ? Math.round((matched / total) * 100) : 0,
  };
}

/** Manuel eşleştirme için açık olan (henüz eşleşmemiş) siparişlerden,
 *  belli bir tutarın ±10₺ etrafında olanları getir. */
export async function suggestOrdersForBankTx(
  amountMinor: number,
  limit = 10,
) {
  const tolerance = 1000; // ±10 TL
  return db.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      total: { gte: amountMinor - tolerance, lte: amountMinor + tolerance },
      bankPayments: { none: { status: { in: ["AUTO_MATCHED", "MANUAL_MATCHED"] } } },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      currency: true,
      createdAt: true,
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
