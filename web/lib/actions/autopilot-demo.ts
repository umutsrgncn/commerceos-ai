"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  autoIssueInvoice,
  autoReplyToReview,
  autoReorderStockIfLow,
} from "@/lib/autopilot/core";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export type DemoResult =
  | { ok: true; message: string; entityId?: string }
  | { ok: false; error: string };

/** Demo: rastgele bir ürüne yeni yorum ekle, otopilot cevap yazsın. */
export async function demoNewReviewAction(): Promise<DemoResult> {
  await requireSession();

  const product = await db.product.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  if (!product) return { ok: false, error: "Yayında ürün yok." };

  const reviewBodies = [
    "Ürün tam beklediğim gibi çıktı, kargo da hızlıydı, teşekkürler!",
    "Kalitesi fiyatına göre çok iyi, kesinlikle tavsiye ederim.",
    "Beden bana büyük geldi, iade için süreç nasıl işliyor?",
    "Renk fotoğraftakinden biraz farklı ama yine de güzel bir ürün.",
    "5 yıldızı hak ediyor, ikinci kez sipariş veriyorum.",
  ];
  const ratings = [5, 5, 4, 4, 5];
  const idx = Math.floor(Math.random() * reviewBodies.length);

  const created = await db.productReview.create({
    data: {
      productId: product.id,
      authorName: ["Ali Yılmaz", "Ayşe Kaya", "Mehmet Demir", "Zeynep Şahin"][
        Math.floor(Math.random() * 4)
      ],
      authorEmail: "demo@example.com",
      rating: ratings[idx],
      body: reviewBodies[idx],
      isPublished: true,
    },
  });

  // Otopilot tetikle
  await autoReplyToReview(created.id);

  revalidatePath("/admin/autopilot");
  revalidatePath(`/admin/products/${product.id}`);
  revalidatePath("/admin/reviews");

  return {
    ok: true,
    message: `Yeni yorum eklendi: ${product.name} — ${ratings[idx]}/5. Otopilot devrede.`,
    entityId: created.id,
  };
}

/** Demo: bir siparişin durumunu CONFIRMED'a çek, otopilot fatura kessin. */
export async function demoConfirmOrderAction(): Promise<DemoResult> {
  await requireSession();

  const order = await db.order.findFirst({
    where: { status: "PENDING", invoice: null },
    orderBy: { createdAt: "desc" },
  });
  if (!order) {
    return {
      ok: false,
      error:
        "PENDING'de faturasız sipariş yok. Sipariş oluştur veya başka birini PENDING'e geri al.",
    };
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: "CONFIRMED" },
  });

  await autoIssueInvoice(order.id);

  revalidatePath("/admin/autopilot");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);

  return {
    ok: true,
    message: `${order.orderNumber} CONFIRMED. Otopilot fatura kesti.`,
    entityId: order.id,
  };
}

/** Demo: rastgele bir ürünün stoğunu kritik seviyeye düşür, otopilot
 *  tedarikçiye sipariş atsın. */
export async function demoStockDropAction(): Promise<DemoResult> {
  await requireSession();

  // Tedarikçide kayıtlı SKU'su olan bir ürün bul
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    select: { productSkus: true },
  });
  const allSkus = suppliers.flatMap((s) => s.productSkus);
  if (allSkus.length === 0) {
    return {
      ok: false,
      error:
        "Hiç tedarikçi yok ya da SKU eklenmemiş. /admin/suppliers'tan ekle.",
    };
  }

  const product = await db.product.findFirst({
    where: { sku: { in: allSkus } },
    include: { inventory: true },
  });
  if (!product) {
    return {
      ok: false,
      error: "Tedarikçilerin SKU'larıyla eşleşen ürün bulunamadı.",
    };
  }

  // Stoğu 3'e düşür (kritik)
  await db.inventory.upsert({
    where: { productId: product.id },
    create: { productId: product.id, quantity: 3 },
    update: { quantity: 3 },
  });

  await autoReorderStockIfLow(product.id);

  revalidatePath("/admin/autopilot");
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/products/${product.id}`);

  return {
    ok: true,
    message: `${product.name} stoğu 3'e düşürüldü. Otopilot tedarikçiye sipariş yazdı.`,
    entityId: product.id,
  };
}
