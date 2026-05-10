import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function listInvoices(filters: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  documentType?: string;
} = {}) {
  const { page = 1, pageSize = 30, q, status, documentType } = filters;
  const ands: Prisma.InvoiceWhereInput[] = [];
  if (q) {
    ands.push({
      OR: [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { uuid: { contains: q } },
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { order: { customer: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (
    status &&
    ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"].includes(status)
  ) {
    ands.push({ status: status as Prisma.InvoiceWhereInput["status"] });
  }
  if (documentType && ["EFATURA", "EARSIV"].includes(documentType)) {
    ands.push({ documentType });
  }
  const where: Prisma.InvoiceWhereInput = ands.length ? { AND: ands } : {};

  const [items, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.invoice.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getInvoiceByOrder(orderId: string) {
  return db.invoice.findUnique({
    where: { orderId },
    include: { order: { select: { orderNumber: true } } },
  });
}

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true,
          items: { include: { product: { select: { sku: true } } } },
        },
      },
    },
  });
}

/** Tüm faturalar üzerinde durum + tutar özeti (filter uygulanır). */
export async function getInvoiceStats(filters: { q?: string } = {}) {
  const { q } = filters;
  const where: Prisma.InvoiceWhereInput = q
    ? {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" } },
          { uuid: { contains: q } },
          { order: { orderNumber: { contains: q, mode: "insensitive" } } },
          { order: { customer: { name: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : {};

  const [byStatus, byDocType, totals] = await Promise.all([
    db.invoice.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { totalMinor: true, taxMinor: true },
    }),
    db.invoice.groupBy({
      by: ["documentType"],
      where,
      _count: { _all: true },
    }),
    db.invoice.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalMinor: true, taxMinor: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((r) => [
      r.status,
      {
        count: r._count._all,
        totalMinor: r._sum.totalMinor ?? 0,
        taxMinor: r._sum.taxMinor ?? 0,
      },
    ])
  );

  const docMap = Object.fromEntries(
    byDocType.map((r) => [r.documentType, r._count._all])
  );

  return {
    total: totals._count._all,
    totalMinor: totals._sum.totalMinor ?? 0,
    taxMinor: totals._sum.taxMinor ?? 0,
    accepted: statusMap.ACCEPTED?.count ?? 0,
    acceptedTotalMinor: statusMap.ACCEPTED?.totalMinor ?? 0,
    rejected: statusMap.REJECTED?.count ?? 0,
    cancelled: statusMap.CANCELLED?.count ?? 0,
    draft: statusMap.DRAFT?.count ?? 0,
    sent: statusMap.SENT?.count ?? 0,
    efatura: docMap.EFATURA ?? 0,
    earsiv: docMap.EARSIV ?? 0,
  };
}

/** Yıl içindeki sıradaki sequence (basit count + 1, race condition'a
 * dayanıklı değil — prod'da advisory lock veya seq table önerilir). */
export async function nextSequenceForYear(year: number): Promise<number> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const count = await db.invoice.count({
    where: { createdAt: { gte: start, lt: end } },
  });
  return count + 1;
}
