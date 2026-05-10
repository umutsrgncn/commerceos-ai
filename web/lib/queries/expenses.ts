import "server-only";
import { Prisma, type ExpenseCategory } from "@prisma/client";
import { db } from "@/lib/db";

export type ExpenseListFilters = {
  q?: string;
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function listExpenses(filters: ExpenseListFilters = {}) {
  const { q, category, from, to, page = 1, pageSize = 30 } = filters;

  const where: Prisma.ExpenseWhereInput = {
    ...(category ? { category } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { vendor: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total, sumResult] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.expense.count({ where }),
    db.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    items,
    total,
    sum: sumResult._sum.amount ?? 0,
    page,
    pageSize,
  };
}

export async function getExpenseById(id: string) {
  return db.expense.findUnique({ where: { id } });
}

export async function getExpensesByCategory(from: Date, to: Date) {
  return db.expense.groupBy({
    by: ["category"],
    where: { date: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: { _all: true },
  });
}
