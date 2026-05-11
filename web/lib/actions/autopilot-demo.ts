"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  autoAnalyzeReview,
  autoIssueInvoice,
  autoReplyToReview,
  autoReorderStockIfLow,
  autoSegmentCustomer,
  runPriceSuggestionScan,
} from "@/lib/autopilot/core";
import { tryAiMatch } from "@/lib/actions/bank";

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

/** Demo: negatif yorum bırak, otopilot flag + analiz tetiklesin. */
export async function demoNegativeReviewAction(): Promise<DemoResult> {
  await requireSession();

  const product = await db.product.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  if (!product) return { ok: false, error: "Yayında ürün yok." };

  const negativeBodies = [
    "Çok kötü bir deneyim yaşadım, ürün tamamen bozuk geldi ve müşteri hizmetleri ilgilenmedi.",
    "Açıklamada yazandan çok farklı, kandırılmış hissettim. İade etmek istiyorum.",
    "Berbat kalite, parasını hak etmiyor. Asla almayın.",
  ];
  const idx = Math.floor(Math.random() * negativeBodies.length);

  const created = await db.productReview.create({
    data: {
      productId: product.id,
      authorName: ["Aslı Çelik", "Burak Öz", "Ceren Aydın"][
        Math.floor(Math.random() * 3)
      ],
      authorEmail: "demo-neg@example.com",
      rating: [1, 2][Math.floor(Math.random() * 2)],
      body: negativeBodies[idx],
      isPublished: false,
    },
  });

  // Önce analiz (sentiment + flag), sonra cevap
  await autoAnalyzeReview(created.id);
  await autoReplyToReview(created.id);

  revalidatePath("/admin/autopilot");
  revalidatePath("/admin/reviews");

  return {
    ok: true,
    message: `Negatif yorum girdi: ${product.name}. AI analiz + flag + Türkçe özür cevabı yazdı.`,
    entityId: created.id,
  };
}

/** Demo: müşterinin hesabına havale geldi, otopilot AI ile sipariş eşleştirsin. */
export async function demoBankPaymentAction(): Promise<DemoResult> {
  await requireSession();

  // PENDING bir sipariş bul (havale yapılacak)
  const order = await db.order.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  if (!order) {
    return {
      ok: false,
      error:
        "PENDING sipariş yok. Önce 'Sipariş onaylansın' demosu için sipariş oluştur.",
    };
  }

  // Sahte havale: müşteri adını + sipariş numarasını açıklamaya yaz
  const description = `${order.customer.name} - ${order.orderNumber} havale`;
  const created = await db.bankTransaction.create({
    data: {
      bankName: "Demo Bank",
      transactionDate: new Date(),
      amountMinor: order.total,
      currency: order.currency,
      direction: "IN",
      description,
      reference: `${order.orderNumber}-${Date.now()}`,
      source: "MANUAL",
      status: "UNMATCHED",
    },
  });

  // AI eşleştirmeyi tetikle
  const matched = await tryAiMatch(created.id);

  revalidatePath("/admin/autopilot");
  revalidatePath("/admin/bank");
  revalidatePath(`/admin/orders/${order.id}`);

  return {
    ok: true,
    message: matched
      ? `Havale geldi: ${order.orderNumber}. AI siparişi otomatik eşleştirdi ve onayladı.`
      : `Havale geldi: ${order.orderNumber}. AI eşleştirme önerisi oluşturdu (manuel onay bekliyor).`,
    entityId: order.id,
  };
}

/** Demo: rastgele bir müşteriyi seç, otopilot AI segmentleme yapsın. */
export async function demoSegmentCustomerAction(): Promise<DemoResult> {
  await requireSession();

  const customer = await db.customer.findFirst({
    where: {
      orders: { some: { status: { in: ["DELIVERED", "CONFIRMED", "SHIPPED"] } } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!customer) {
    return { ok: false, error: "Sipariş geçmişi olan müşteri yok." };
  }

  await autoSegmentCustomer(customer.id);

  revalidatePath("/admin/autopilot");
  revalidatePath(`/admin/customers/${customer.id}`);

  return {
    ok: true,
    message: `${customer.name} için AI segment + aksiyon önerisi oluşturuldu.`,
    entityId: customer.id,
  };
}

/** Demo: yavaş hareket eden ürünleri tara, otopilot fiyat önerisi yapsın. */
export async function demoPriceSuggestionAction(): Promise<DemoResult> {
  await requireSession();

  const result = await runPriceSuggestionScan({ productLimit: 3 });

  revalidatePath("/admin/autopilot");
  revalidatePath("/admin/products");

  if (result.suggested === 0) {
    if (result.scanned === 0) {
      return {
        ok: false,
        error:
          "Fiyat önerisi yapılacak ürün yok (1 hafta+ güncellenmemiş + maliyet fiyatı olan).",
      };
    }
    return {
      ok: false,
      error: `${result.scanned} ürün tarandı, AI yeni öneri yapmadı. Otopilot autoSuggestPrice ayarını aç.`,
    };
  }

  return {
    ok: true,
    message: `AI ${result.suggested} ürün için fiyat önerisi yazdı (${result.scanned} tarandı).`,
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
