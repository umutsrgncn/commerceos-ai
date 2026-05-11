"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { requireRole } from "@/lib/auth/permissions";
import { orderCreateSchema, orderStatusTransitionSchema } from "@/lib/schemas/orders";
import { canTransition, generateOrderNumber } from "@/lib/orders/workflow";

export type OrderActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  return requireRole("MANAGER");
}

function parseItems(formData: FormData) {
  // Items posted as items[0].productId / items[0].quantity etc.
  const items: { productId: string; quantity: string }[] = [];
  for (let i = 0; i < 50; i++) {
    const productId = formData.get(`items[${i}].productId`);
    if (!productId) continue;
    items.push({
      productId: String(productId),
      quantity: String(formData.get(`items[${i}].quantity`) ?? "0"),
    });
  }
  return items;
}

function parseShippingAddress(formData: FormData) {
  const fullName = String(formData.get("ship.fullName") ?? "").trim();
  if (!fullName) return null;
  return {
    fullName,
    phone: (formData.get("ship.phone") as string) || null,
    line1: (formData.get("ship.line1") as string) || "",
    line2: (formData.get("ship.line2") as string) || null,
    city: (formData.get("ship.city") as string) || "",
    district: (formData.get("ship.district") as string) || null,
    postalCode: (formData.get("ship.postalCode") as string) || null,
    country: (formData.get("ship.country") as string) || "TR",
  };
}

function parseBillingAddress(formData: FormData) {
  const fullName = String(formData.get("bill.fullName") ?? "").trim();
  if (!fullName) return null;
  return {
    fullName,
    phone: (formData.get("bill.phone") as string) || null,
    line1: (formData.get("bill.line1") as string) || "",
    line2: (formData.get("bill.line2") as string) || null,
    city: (formData.get("bill.city") as string) || "",
    district: (formData.get("bill.district") as string) || null,
    postalCode: (formData.get("bill.postalCode") as string) || null,
    country: (formData.get("bill.country") as string) || "TR",
    isCompany: formData.get("bill.isCompany") === "on",
    taxId: (formData.get("bill.taxId") as string) || null,
    taxOffice: (formData.get("bill.taxOffice") as string) || null,
  };
}

export async function createOrderAction(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const session = await requireSession();

  const billingSameAsShipping = formData.get("billingSameAsShipping") === "on";
  const ship = parseShippingAddress(formData);
  const billRaw = parseBillingAddress(formData);
  const bill = billingSameAsShipping && ship
    ? {
        ...ship,
        isCompany: false,
        taxId: null,
        taxOffice: null,
      }
    : billRaw;

  const raw = {
    customerId: formData.get("customerId"),
    items: parseItems(formData),
    taxRate: formData.get("taxRate") ?? 0,
    shipping: formData.get("shipping") ?? 0,
    notes: formData.get("notes") || null,
    shippingAddress: ship,
    billingAddress: bill,
    billingSameAsShipping,
  };

  const parsed = orderCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const {
    customerId,
    items,
    taxRate,
    shipping,
    notes,
    shippingAddress,
    billingAddress,
    billingSameAsShipping: billSameAs,
  } = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, price: true, currency: true },
  });

  if (products.length !== items.length) {
    return { error: "Bazı ürünler bulunamadı." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const currency = products[0].currency;
  if (products.some((p) => p.currency !== currency)) {
    return { error: "Tüm kalemler aynı para biriminde olmalı." };
  }

  const orderItems = items.map((row) => {
    const p = productMap.get(row.productId)!;
    const total = p.price * row.quantity;
    return {
      productId: p.id,
      name: p.name,
      quantity: row.quantity,
      unitPrice: p.price,
      total,
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax + shipping;

  // Retry orderNumber on rare collision (unique constraint).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Sipariş + stok rezervasyonu tek transaction'da
      const created = await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerId,
            createdById: session.user.id,
            status: "PENDING",
            subtotal,
            tax,
            shipping,
            total,
            currency,
            notes: notes ?? null,
            shippingAddress: shippingAddress
              ? (shippingAddress as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            billingAddress: billingAddress
              ? (billingAddress as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            billingSameAsShipping: billSameAs,
            items: { create: orderItems },
          },
          select: { id: true, orderNumber: true },
        });

        // Stok rezervasyonu — her item için inventory.reserved += qty
        for (const it of orderItems) {
          await tx.inventory.upsert({
            where: { productId: it.productId },
            update: { reserved: { increment: it.quantity } },
            create: {
              productId: it.productId,
              quantity: 0,
              reserved: it.quantity,
            },
          });
        }

        return order;
      });

      await recordActivity({
        action: "order.create",
        entityType: "order",
        entityId: created.id,
        metadata: { orderNumber: created.orderNumber, total, currency },
      });

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/customers/${customerId}`);
      redirect(`/admin/orders/${created.id}`);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // collision on orderNumber — retry
        continue;
      }
      throw err;
    }
  }

  return { error: "Sipariş numarası oluşturulamadı, tekrar dene." };
}

export async function transitionOrderAction(formData: FormData) {
  await requireSession();

  const parsed = orderStatusTransitionSchema.safeParse({
    id: formData.get("id"),
    to: formData.get("to"),
  });
  if (!parsed.success) return;

  const { id, to } = parsed.data;
  const order = await db.order.findUnique({
    where: { id },
    select: { status: true, items: { select: { productId: true, quantity: true } } },
  });
  if (!order) return;

  if (!canTransition(order.status, to)) {
    throw new Error(`İzinsiz geçiş: ${order.status} → ${to}`);
  }

  const from = order.status;

  // Stok rezervasyonu güncelle (transaction)
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: to } });

    // PENDING → CONFIRMED: reserved'tan düş + quantity'den de düş (gerçek satış)
    if (from === "PENDING" && to === "CONFIRMED") {
      for (const it of order.items) {
        await tx.inventory.update({
          where: { productId: it.productId },
          data: {
            reserved: { decrement: it.quantity },
            quantity: { decrement: it.quantity },
          },
        });
      }
    }
    // PENDING → CANCELLED: sadece reserved'ı geri al (quantity dokunma)
    else if (from === "PENDING" && to === "CANCELLED") {
      for (const it of order.items) {
        await tx.inventory.update({
          where: { productId: it.productId },
          data: { reserved: { decrement: it.quantity } },
        });
      }
    }
    // CONFIRMED+ → CANCELLED/REFUNDED: stoğa geri yaz (quantity += qty)
    else if (
      (from === "CONFIRMED" ||
        from === "SHIPPED" ||
        from === "DELIVERED") &&
      (to === "CANCELLED" || to === "REFUNDED")
    ) {
      for (const it of order.items) {
        await tx.inventory.update({
          where: { productId: it.productId },
          data: { quantity: { increment: it.quantity } },
        });
      }
    }
  });

  await recordActivity({
    action: "order.transition",
    entityType: "order",
    entityId: id,
    metadata: { from, to },
  });

  // Otopilot: CONFIRMED'a geçişte fatura kes
  if (to === "CONFIRMED") {
    try {
      const { autoIssueInvoice } = await import("@/lib/autopilot/core");
      await autoIssueInvoice(id);
    } catch {
      // sessizce devam
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
