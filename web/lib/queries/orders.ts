import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type OrderListFilters = {
  q?: string;
  status?: OrderStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
};

export async function listOrders(filters: OrderListFilters = {}) {
  const { q, status, customerId, page = 1, pageSize = 20 } = filters;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(customerId ? { customerId } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
            { customer: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          notes: true,
          aiSegment: true,
        },
      },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listAvailableProductsForOrder() {
  return db.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      currency: true,
      inventory: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });
}
