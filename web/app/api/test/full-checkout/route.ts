/**
 * INTERNAL TEST — Full shop flow end-to-end (auth + cart + checkout).
 * Server actions yerine doğrudan helper'ları çağırır.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { addToCart, readCart, clearCart } from "@/lib/shop/cart";
import { registerCustomer, getCurrentCustomer } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in prod" }, { status: 403 });
  }

  const steps: Array<{ step: string; ok: boolean; data?: unknown; error?: string }> = [];

  try {
    // 1) Kayıt (varsa skip)
    const email = `e2e-${Date.now()}@pamuk.com`;
    const reg = await registerCustomer(email, "E2E Auto", "test1234", "0555");
    steps.push({ step: "register", ok: reg.ok, data: reg });

    // 2) Cart'a bir ürün ekle
    const product = await db.product.findFirst({
      where: { status: "PUBLISHED", inventory: { quantity: { gt: 0 } } },
      select: { id: true, name: true, price: true },
    });
    if (!product) {
      return NextResponse.json({ error: "stoklu ürün yok" });
    }
    await addToCart(product.id, 1);
    const cart = await readCart();
    steps.push({ step: "addToCart", ok: cart.items.length > 0, data: { items: cart.items.length, subtotal: cart.subtotal } });

    // 3) Manuel Order create (submit action mock POS flow'unu taklit)
    const session = await getCurrentCustomer();
    if (!session) {
      steps.push({ step: "session", ok: false, error: "registerCustomer cookie set etmedi!" });
      return NextResponse.json({ steps });
    }
    steps.push({ step: "session", ok: true, data: { id: session.id, email: session.email } });

    const subtotal = cart.subtotal;
    const tax = Math.round(subtotal * 0.2);
    const shipping = subtotal >= 75000 ? 0 : 4990;
    const total = subtotal + tax + shipping;
    const orderNumber = `OS${Date.now().toString().slice(-8)}`;

    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId: session.id,
          currency: "TRY",
          status: "CONFIRMED",
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: {
            fullName: session.name,
            phone: session.phone ?? "0555",
            line1: "Test Sokak No 1",
            city: "İstanbul",
          },
          notes: "MOCK POS E2E test · 4111",
          items: {
            create: cart.items.map((it) => ({
              productId: it.productId,
              name: it.name,
              quantity: it.quantity,
              unitPrice: it.price,
              total: it.price * it.quantity,
            })),
          },
        },
        select: { id: true, orderNumber: true },
      });
      for (const it of cart.items) {
        await tx.inventory.updateMany({
          where: { productId: it.productId },
          data: { quantity: { decrement: it.quantity } },
        });
      }
      return o;
    });
    steps.push({ step: "orderCreate", ok: true, data: order });

    await clearCart();
    const jar = await cookies();
    jar.delete("commerceos_cart");
    steps.push({ step: "cartClear", ok: true });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      steps,
    });
  } catch (e) {
    steps.push({
      step: "FAILED",
      ok: false,
      error: e instanceof Error ? `${e.message}\n${e.stack}` : "unknown",
    });
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
}
