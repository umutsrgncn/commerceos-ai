"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { orderCreateSchema, orderStatusTransitionSchema } from "@/lib/schemas/orders";
import { canTransition, generateOrderNumber } from "@/lib/orders/workflow";

export type OrderActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
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

export async function createOrderAction(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const session = await requireSession();

  const raw = {
    customerId: formData.get("customerId"),
    items: parseItems(formData),
    taxRate: formData.get("taxRate") ?? 0,
    shipping: formData.get("shipping") ?? 0,
    notes: formData.get("notes") || null,
  };

  const parsed = orderCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
      error: flat.formErrors[0],
    };
  }

  const { customerId, items, taxRate, shipping, notes } = parsed.data;

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
      const created = await db.order.create({
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
          items: { create: orderItems },
        },
        select: { id: true, orderNumber: true },
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
  const order = await db.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) return;

  if (!canTransition(order.status, to)) {
    throw new Error(`İzinsiz geçiş: ${order.status} → ${to}`);
  }

  await db.order.update({ where: { id }, data: { status: to } });
  await recordActivity({
    action: "order.transition",
    entityType: "order",
    entityId: id,
    metadata: { from: order.status, to },
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
