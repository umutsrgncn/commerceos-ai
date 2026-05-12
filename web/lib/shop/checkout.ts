"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { z } from "zod";
import { readCart, clearCart } from "./cart";

const COOKIE_NAME = "commerceos_cart";

const SHIPPING_THRESHOLD = 75000;
const SHIPPING_COSTS: Record<string, number> = {
  standard: 4990,
  express: 9990,
};

const checkoutSchema = z.object({
  // Müşteri bilgisi
  email: z.string().email("Geçerli e-posta gerekli").max(160),
  fullName: z.string().min(2, "Ad en az 2 karakter").max(160),
  phone: z.string().min(10, "Geçerli telefon").max(20),
  // Adres
  line1: z.string().min(5, "Adres satırı en az 5 karakter").max(300),
  city: z.string().min(2).max(80),
  district: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  // Kargo seçimi
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  // KVKK
  kvkkAccepted: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true" || v === "on"),
});

export type CheckoutActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  orderNumber?: string;
} | null;

export async function submitCheckoutAction(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  // 1) Form parse
  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    city: formData.get("city"),
    district: formData.get("district") || null,
    postalCode: formData.get("postalCode") || null,
    shippingMethod: formData.get("shippingMethod") || "standard",
    kvkkAccepted: formData.get("kvkkAccepted") ?? false,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!parsed.data.kvkkAccepted) {
    return { error: "KVKK aydınlatma metnini onaylamalısın." };
  }

  // 2) Sepet kontrol
  const cart = await readCart();
  if (cart.items.length === 0) {
    return { error: "Sepetin boş." };
  }

  // 3) Müşteri upsert
  const customer = await db.customer.upsert({
    where: { email: parsed.data.email },
    update: {
      name: parsed.data.fullName,
      phone: parsed.data.phone,
    },
    create: {
      email: parsed.data.email,
      name: parsed.data.fullName,
      phone: parsed.data.phone,
    },
    select: { id: true },
  });

  // 4) Adres oluştur (default olarak işaretle, mevcut default'u false yap)
  await db.customerAddress.updateMany({
    where: { customerId: customer.id, isDefault: true },
    data: { isDefault: false },
  });
  await db.customerAddress.create({
    data: {
      customerId: customer.id,
      label: "Teslimat",
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      city: parsed.data.city,
      district: parsed.data.district ?? null,
      postalCode: parsed.data.postalCode ?? null,
      isDefault: true,
    },
  });

  // 5) Fiyat hesapla
  const subtotal = cart.subtotal;
  const shippingCost =
    subtotal >= SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_COSTS[parsed.data.shippingMethod] ?? SHIPPING_COSTS.standard;
  const tax = Math.round(subtotal * 0.2); // %20 KDV varsayım
  const total = subtotal + shippingCost + tax;

  // 6) Order oluştur (tx — stock düşürme + cart temizleme)
  const orderNumber = `OS${Date.now().toString().slice(-8)}`;
  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        currency: "TRY",
        status: "PENDING",
        subtotal,
        tax,
        shipping: shippingCost,
        total,
        shippingAddress: {
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          city: parsed.data.city,
          district: parsed.data.district,
          postalCode: parsed.data.postalCode,
        },
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

    // Stock decrement
    for (const it of cart.items) {
      await tx.inventory.updateMany({
        where: { productId: it.productId },
        data: { quantity: { decrement: it.quantity } },
      });
    }
    return created;
  });

  // 7) Cart temizle + cookie sil
  await clearCart();
  const jar = await cookies();
  jar.delete(COOKIE_NAME);

  // 8) Onay sayfasına yönlendir
  redirect(`/shop/checkout/success?order=${order.orderNumber}`);
}
