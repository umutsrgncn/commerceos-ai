import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type CustomerSort =
  | "created_desc"
  | "created_asc"
  | "orders_desc"
  | "name_asc";

const CUSTOMER_ORDER_BY: Record<
  CustomerSort,
  Prisma.CustomerOrderByWithRelationInput
> = {
  created_desc: { createdAt: "desc" },
  created_asc: { createdAt: "asc" },
  orders_desc: { orders: { _count: "desc" } },
  name_asc: { name: "asc" },
};

export type CustomerListFilters = {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: CustomerSort;
};

export async function listCustomers(filters: CustomerListFilters = {}) {
  const { q, page = 1, pageSize = 20, sort = "created_desc" } = filters;

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
      orderBy: CUSTOMER_ORDER_BY[sort] ?? CUSTOMER_ORDER_BY.created_desc,
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
