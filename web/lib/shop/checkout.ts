"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { z } from "zod";
import { readCart, clearCart } from "./cart";

const COOKIE_NAME = "commerceos_cart";
const PENDING_COOKIE = "commerceos_checkout_pending";

const SHIPPING_THRESHOLD = 75000;
const SHIPPING_COSTS: Record<string, number> = {
  standard: 4990,
  express: 9990,
};

const stepOneSchema = z.object({
  email: z.string().email("Geçerli e-posta gerekli").max(160),
  fullName: z.string().min(2, "Ad en az 2 karakter").max(160),
  phone: z.string().min(10, "Geçerli telefon").max(20),
  line1: z.string().min(5, "Adres satırı en az 5 karakter").max(300),
  city: z.string().min(2).max(80),
  district: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  kvkkAccepted: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true" || v === "on"),
});

const stepTwoSchema = z.object({
  cardNumber: z.string().transform((s) => s.replace(/\s+/g, "")),
  cardHolder: z.string().min(3, "Kart sahibi en az 3 karakter").max(80),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY formatı"),
  cardCvv: z.string().regex(/^\d{3,4}$/, "3-4 haneli CVV"),
});

export type CheckoutActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** ─── Step 1: address + shipping → cookie'ye kaydet, /shop/checkout/payment'a yönlendir ─── */
export async function submitCheckoutStepOneAction(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = stepOneSchema.safeParse({
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

  const cart = await readCart();
  if (cart.items.length === 0) {
    return { error: "Sepetin boş." };
  }

  // Adres/kargo bilgisini cookie'ye sakla (signed olmasa da hackathon ok)
  const { kvkkAccepted: _kvkk, ...payload } = parsed.data;
  const jar = await cookies();
  jar.set(PENDING_COOKIE, JSON.stringify(payload), {
    maxAge: 60 * 30, // 30 dakika
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/shop/checkout/payment");
}

/** ─── Step 2: kart bilgisi → MOCK POS → order create ─── */
export async function submitMockPaymentAction(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const jar = await cookies();
  const pendingRaw = jar.get(PENDING_COOKIE)?.value;
  if (!pendingRaw) {
    return { error: "Oturum süresi doldu, baştan başla.", fieldErrors: {} };
  }
  let pending: z.infer<typeof stepOneSchema>;
  try {
    pending = JSON.parse(pendingRaw);
  } catch {
    return { error: "Oturum bozuk, baştan başla." };
  }

  const parsed = stepTwoSchema.safeParse({
    cardNumber: formData.get("cardNumber"),
    cardHolder: formData.get("cardHolder"),
    cardExpiry: formData.get("cardExpiry"),
    cardCvv: formData.get("cardCvv"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // MOCK POS — kart numarasına göre simulated outcome
  const cardNum = parsed.data.cardNumber;
  // Yapay 1.2 saniye gecikme (gerçek POS hissi)
  await new Promise((r) => setTimeout(r, 1200));

  // Test kart davranışı:
  //   4111 1111 1111 1111 → BAŞARILI
  //   4000 0000 0000 0002 → KART RED
  //   4000 0000 0000 0119 → YETERSİZ BAKİYE
  //   diğer → %95 başarı, %5 random red
  if (cardNum === "4000000000000002") {
    return { error: "Kart bankası tarafından reddedildi (test kart)." };
  }
  if (cardNum === "4000000000000119") {
    return { error: "Yetersiz bakiye (test kart)." };
  }
  if (cardNum.length < 13) {
    return { fieldErrors: { cardNumber: ["Kart numarası 13-19 hane olmalı"] } };
  }
  if (cardNum !== "4111111111111111" && Math.random() < 0.05) {
    return { error: "Banka onayı alınamadı, tekrar dene." };
  }

  // ─── ÖDEME BAŞARILI — Order create ───
  const cart = await readCart();
  if (cart.items.length === 0) {
    return { error: "Sepetin boş." };
  }

  const customer = await db.customer.upsert({
    where: { email: pending.email },
    update: { name: pending.fullName, phone: pending.phone },
    create: {
      email: pending.email,
      name: pending.fullName,
      phone: pending.phone,
    },
    select: { id: true },
  });

  await db.customerAddress.updateMany({
    where: { customerId: customer.id, isDefault: true },
    data: { isDefault: false },
  });
  await db.customerAddress.create({
    data: {
      customerId: customer.id,
      label: "Teslimat",
      fullName: pending.fullName,
      phone: pending.phone,
      line1: pending.line1,
      city: pending.city,
      district: pending.district ?? null,
      postalCode: pending.postalCode ?? null,
      isDefault: true,
    },
  });

  const subtotal = cart.subtotal;
  const shippingCost =
    subtotal >= SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_COSTS[pending.shippingMethod] ?? SHIPPING_COSTS.standard;
  const tax = Math.round(subtotal * 0.2);
  const total = subtotal + shippingCost + tax;
  const orderNumber = `OS${Date.now().toString().slice(-8)}`;
  const last4 = cardNum.slice(-4);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        currency: "TRY",
        status: "CONFIRMED", // mock pos → direkt CONFIRMED
        subtotal,
        tax,
        shipping: shippingCost,
        total,
        shippingAddress: {
          fullName: pending.fullName,
          phone: pending.phone,
          line1: pending.line1,
          city: pending.city,
          district: pending.district,
          postalCode: pending.postalCode,
        },
        notes: `MOCK POS · Kart son 4: ${last4}`,
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
    return created;
  });

  // Cart + pending cookie temizle
  await clearCart();
  jar.delete(COOKIE_NAME);
  jar.delete(PENDING_COOKIE);

  redirect(`/shop/checkout/success?order=${order.orderNumber}`);
}

/** Eski isim — eski form'lar için backward compat alias */
export const submitCheckoutAction = submitCheckoutStepOneAction;

/** Step 2 sayfası için: pending adres bilgisini oku (gösterim için) */
export async function getPendingCheckout() {
  const jar = await cookies();
  const raw = jar.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Omit<
      z.infer<typeof stepOneSchema>,
      "kvkkAccepted"
    > & { shippingMethod: "standard" | "express" };
  } catch {
    return null;
  }
}
