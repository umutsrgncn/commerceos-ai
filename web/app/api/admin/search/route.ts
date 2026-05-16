import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin topbar search — multi-resource quick search.
 * Sadece logged-in kullanıcılar. q min 2 char.
 *
 * Dönen şekil:
 *   { products: [...], orders: [...], customers: [...] }
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [], orders: [], customers: [] });
  }

  // Paralel: ürün adı/SKU, sipariş numarası, müşteri adı/email
  const [products, orders, customers] = await Promise.all([
    db.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        currency: true,
        images: true,
        status: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    db.order.findMany({
      where: { orderNumber: { contains: q, mode: "insensitive" } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ products, orders, customers });
}
