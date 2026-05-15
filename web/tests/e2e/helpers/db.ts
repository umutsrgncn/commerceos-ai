/**
 * E2E test'leri için Prisma helper.
 *
 * Testler ASLA public schema'ya yazmamalı — DATABASE_URL parse edilip
 * schema=commerceos_test olduğu doğrulanmadan PrismaClient açılmaz.
 *
 * Cleanup E2E_ prefix'ine bakar; test data izole tutulur.
 */

import { PrismaClient } from "@prisma/client";
import { E2E_PREFIX } from "./test-user";

let prisma: PrismaClient | null = null;

/**
 * DATABASE_URL'in test schema'sına bağlı olduğunu KESİN doğrula.
 * public veya schema parametresiz URL ile e2e koşulamaz — production veri
 * kaybı riskini sıfırlamak için.
 */
export function assertTestSchema(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "E2E ABORTED: DATABASE_URL set değil. Testler asla public'e dokunmamalı.",
    );
  }
  if (url.includes("schema=public")) {
    throw new Error(
      `E2E ABORTED: DATABASE_URL schema=public içeriyor. Testler asla canlı public'e yazmaz. ` +
        `Setup'ta schema=commerceos_test ile çalıştır.`,
    );
  }
  if (!url.includes("schema=commerceos_test")) {
    throw new Error(
      `E2E ABORTED: DATABASE_URL schema=commerceos_test içermiyor. ` +
        `Mevcut URL'nin schema kısmı belirsiz — güvenlik için reddedildi.`,
    );
  }
}

export function getDb(): PrismaClient {
  if (!prisma) {
    assertTestSchema();
    prisma = new PrismaClient({
      log: process.env.E2E_DEBUG_DB === "1" ? ["query", "error"] : ["error"],
    });
  }
  return prisma;
}

export async function disconnectDb() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// ─── Settings (singleton) ───────────────────────────────────────────────────

const SETTINGS_ID = "default";

/** Otopilot kapalı garantisi — globalSetup ve afterEach'lerde çağrılır. */
export async function setAutoPilotEnabled(enabled: boolean) {
  const db = getDb();
  return db.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { autoPilotEnabled: enabled },
    create: { id: SETTINGS_ID, autoPilotEnabled: enabled },
  });
}

export async function isAutoPilotEnabled(): Promise<boolean> {
  const s = await getDb().systemSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { autoPilotEnabled: true },
  });
  return s?.autoPilotEnabled ?? false;
}

// ─── Cleanup (E2E_ prefix'iyle yazılan her şey) ─────────────────────────────

/** Test'lerin oluşturduğu E2E_ prefix'li kayıtları temizler. */
export async function cleanupE2eData() {
  const db = getDb();

  // Sıra önemli: foreign key constraints
  await db.bankTransaction.deleteMany({
    where: { description: { startsWith: E2E_PREFIX } },
  });
  await db.autoPilotAction.deleteMany({
    where: { triggerSummary: { startsWith: E2E_PREFIX } },
  });
  await db.customerEmail.deleteMany({
    where: { campaignTag: { startsWith: "e2e_" } },
  });
  await db.invoice.deleteMany({
    where: { order: { notes: { startsWith: E2E_PREFIX } } },
  });
  await db.refund.deleteMany({
    where: { order: { notes: { startsWith: E2E_PREFIX } } },
  });
  await db.orderItem.deleteMany({
    where: { order: { notes: { startsWith: E2E_PREFIX } } },
  });
  await db.order.deleteMany({
    where: { notes: { startsWith: E2E_PREFIX } },
  });
  await db.productReview.deleteMany({
    where: { authorEmail: { startsWith: "e2e_" } },
  });
  await db.inventoryAdjustment.deleteMany({
    where: { note: { startsWith: E2E_PREFIX } },
  });
  await db.inventory.deleteMany({
    where: { product: { name: { startsWith: E2E_PREFIX } } },
  });
  await db.expense.deleteMany({
    where: { description: { startsWith: E2E_PREFIX } },
  });
  await db.discount.deleteMany({
    where: { code: { startsWith: E2E_PREFIX } },
  });
  await db.product.deleteMany({
    where: { name: { startsWith: E2E_PREFIX } },
  });
  await db.customer.deleteMany({
    where: { email: { startsWith: "e2e_" } },
  });
  await db.supplier.deleteMany({
    where: { name: { startsWith: E2E_PREFIX } },
  });
  await db.salesGoal.deleteMany({
    where: { notes: { startsWith: E2E_PREFIX } },
  });
  await db.activityLog.deleteMany({
    where: {
      OR: [
        { metadata: { path: ["e2e"], equals: true } },
      ],
    },
  });
}

// ─── Seed helpers (programmatic data creation) ──────────────────────────────

export async function seedCustomer(input?: {
  name?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
}) {
  const db = getDb();
  const ts = Date.now();
  return db.customer.create({
    data: {
      name: input?.name ?? `${E2E_PREFIX}Customer_${ts}`,
      email: input?.email ?? `e2e_customer_${ts}@example.com`,
      phone: input?.phone ?? "+90 555 000 00 01",
      address: (input?.address ?? {
        line1: "Test Adres",
        city: "İstanbul",
        country: "Türkiye",
      }) as never,
    },
  });
}

export async function seedProduct(input?: {
  name?: string;
  sku?: string;
  price?: number; // kuruş
  costPrice?: number; // kuruş
  stock?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const db = getDb();
  const ts = Date.now();
  const name = input?.name ?? `${E2E_PREFIX}Product_${ts}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const sku = input?.sku ?? `${E2E_PREFIX}SKU-${ts}`;

  const product = await db.product.create({
    data: {
      name,
      slug,
      sku,
      price: input?.price ?? 10000, // 100 TL default
      costPrice: input?.costPrice ?? 5000, // 50 TL default
      currency: "TRY",
      status: input?.status ?? "PUBLISHED",
      images: [],
    },
  });

  if (input?.stock != null) {
    await db.inventory.create({
      data: { productId: product.id, quantity: input.stock },
    });
  }

  return product;
}

export async function seedOrder(input: {
  customerId: string;
  productId: string;
  quantity?: number;
  status?:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
}) {
  const db = getDb();
  const ts = Date.now();

  const product = await db.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) throw new Error(`Product not found: ${input.productId}`);

  const qty = input.quantity ?? 1;
  const itemTotal = product.price * qty;

  const orderNumber = `${E2E_PREFIX}ORD-${ts.toString(36).toUpperCase()}`;

  return db.order.create({
    data: {
      orderNumber,
      customerId: input.customerId,
      status: input.status ?? "PENDING",
      subtotal: itemTotal,
      tax: 0,
      shipping: 0,
      total: itemTotal,
      currency: "TRY",
      notes: `${E2E_PREFIX}seed`,
      items: {
        create: {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
          total: itemTotal,
        },
      },
    },
    include: { items: true },
  });
}

export async function seedSupplier(input?: {
  name?: string;
  email?: string;
  productSkus?: string[];
}) {
  const db = getDb();
  const ts = Date.now();
  return db.supplier.create({
    data: {
      name: input?.name ?? `${E2E_PREFIX}Supplier_${ts}`,
      email:
        input?.email ?? `e2e_supplier_${ts}_${Math.random().toString(36).slice(2, 6)}@example.com`,
      contactPerson: "E2E Test İlgili",
      productSkus: input?.productSkus ?? [],
      leadTimeDays: 5,
      isActive: true,
    },
  });
}

export async function seedReview(input: {
  productId: string;
  rating?: number;
  body?: string;
  authorName?: string;
  authorEmail?: string;
}) {
  const db = getDb();
  const ts = Date.now();
  return db.productReview.create({
    data: {
      productId: input.productId,
      authorName: input.authorName ?? `${E2E_PREFIX}Reviewer`,
      authorEmail: input.authorEmail ?? `e2e_review_${ts}@example.com`,
      rating: input.rating ?? 5,
      body: input.body ?? "Mükemmel ürün, hızlı kargo!",
      isPublished: true,
    },
  });
}

export async function seedExpense(input?: {
  amount?: number; // kuruş
  category?: string;
  description?: string;
}) {
  const db = getDb();
  const ts = Date.now();
  return db.expense.create({
    data: {
      date: new Date(),
      amount: input?.amount ?? 50000, // 500 TL
      currency: "TRY",
      category: (input?.category ?? "OTHER") as never,
      description: input?.description ?? `${E2E_PREFIX}expense ${ts}`,
    },
  });
}
