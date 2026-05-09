import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CustomerListFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listCustomers(filters: CustomerListFilters = {}) {
  const { q, page = 1, pageSize = 20 } = filters;

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { orders: true } },
      },
    }),
    db.customer.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCustomerById(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  });
}
