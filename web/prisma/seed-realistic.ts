/**
 * 1 yıllık gerçekçi e-ticaret seed'i.
 *
 * Çalıştır: pnpm tsx prisma/seed-realistic.ts
 *
 * Üretir (yaklaşık):
 *  - 70 müşteri (sezonsal AI segmentli)
 *  - 8 kategori, 40 ürün
 *  - 600 sipariş (12 aya yayılı, sezonsal)
 *  - 350+ fatura (CONFIRMED+ siparişler)
 *  - 200 gider (kira/personel recurring + ad-hoc)
 *  - 200 yorum (yarısı AI cevaplı)
 *  - 80 banka tx (60 matched, 20 unmatched)
 *  - 12 aylık satış hedefi
 *  - 6 tedarikçi, 4 indirim, 30 otopilot aksiyonu
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ─── Yardımcılar ────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function dateNDaysAgo(days: number, hourSpread = true): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  if (hourSpread) {
    d.setHours(randInt(8, 22));
    d.setMinutes(randInt(0, 59));
  }
  return d;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Sezonsal sipariş yoğunluğu: ay başına çarpan (1.0 = baseline)
const SEASONAL_MULTIPLIERS: Record<number, number> = {
  0: 0.7,  // Ocak — düşük
  1: 0.6,  // Şubat
  2: 0.9,  // Mart
  3: 1.1,  // Nisan
  4: 1.2,  // Mayıs
  5: 1.1,  // Haziran
  6: 1.0,  // Temmuz
  7: 1.0,  // Ağustos
  8: 1.2,  // Eylül — okul
  9: 1.3,  // Ekim
  10: 1.8, // Kasım — Black Friday
  11: 1.6, // Aralık — yılbaşı
};

// ─── Veri kaynakları ────────────────────────────────────────────────────────

const TR_FIRST_NAMES = [
  "Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin", "İbrahim",
  "Ayşe", "Fatma", "Zeynep", "Elif", "Hatice", "Emine", "Merve", "Esra",
  "Esma", "Sevgi", "Selin", "Duygu", "Burcu", "Pınar", "Deniz",
  "Can", "Cem", "Burak", "Emre", "Yusuf", "Murat", "Serkan", "Onur",
  "Berk", "Kaan", "Tolga", "Barış", "Ozan", "Furkan", "Eren",
  "Defne", "Damla", "Buse", "Ceren", "İrem", "Gizem", "Sude", "Lara",
  "Ada", "Yağmur", "Su", "Gül", "Nehir", "Bade", "Naz",
];

const TR_LAST_NAMES = [
  "Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Yıldız", "Yıldırım",
  "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan",
  "Çetin", "Kara", "Koç", "Kurt", "Polat", "Aksoy", "Ay", "Türk",
  "Erdoğan", "Pehlivan", "Karaca", "Acar", "Erkan", "Tan", "Yavuz",
  "Beyaz", "Mavi", "Güzel", "Altın", "Tunç", "Akın", "Bulut", "Güneş",
];

const TR_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya",
  "Gaziantep", "Kayseri", "Eskişehir", "Mersin", "Diyarbakır", "Samsun",
  "Trabzon", "Denizli", "Sakarya",
];

const STREETS = [
  "Atatürk Caddesi", "Cumhuriyet Caddesi", "İstiklal Caddesi",
  "Bağdat Caddesi", "Barbaros Bulvarı", "Vatan Caddesi",
  "Çamlıca Sokak", "Gül Sokak", "Lale Sokak", "Park Sokak",
  "Mavi Sokak", "Yeşil Sokak", "Pamuk Sokak",
];

// 8 kategori, kategoriden ürün
const CATEGORY_PRODUCTS: Record<
  string,
  Array<{ name: string; price: number; cost: number }>
> = {
  Tişört: [
    { name: "Pamuk Basic Tişört Beyaz", price: 14900, cost: 6500 },
    { name: "Oversize Tişört Siyah", price: 19900, cost: 8500 },
    { name: "V-Yaka Tişört Lacivert", price: 17900, cost: 7800 },
    { name: "Slim Fit Tişört Bordo", price: 16900, cost: 7200 },
    { name: "Polo Yaka Tişört Beyaz", price: 24900, cost: 11000 },
    { name: "Crop Tişört Pembe", price: 18900, cost: 8000 },
  ],
  Pantolon: [
    { name: "Slim Fit Kot Pantolon Mavi", price: 49900, cost: 22000 },
    { name: "Chino Pantolon Bej", price: 39900, cost: 17000 },
    { name: "Eşofman Altı Gri", price: 29900, cost: 13000 },
    { name: "Klasik Kumaş Pantolon Siyah", price: 59900, cost: 25000 },
    { name: "Mom Jean Açık Mavi", price: 44900, cost: 19000 },
  ],
  Ayakkabı: [
    { name: "Sneaker Beyaz", price: 89900, cost: 38000 },
    { name: "Bot Kahverengi", price: 129900, cost: 56000 },
    { name: "Topuklu Ayakkabı Siyah", price: 79900, cost: 32000 },
    { name: "Loafer Lacivert", price: 99900, cost: 42000 },
    { name: "Sandalet Bej", price: 49900, cost: 19000 },
  ],
  Çanta: [
    { name: "Sırt Çantası Siyah", price: 49900, cost: 21000 },
    { name: "Omuz Çantası Bordo", price: 39900, cost: 16000 },
    { name: "Cüzdan Kahverengi", price: 24900, cost: 9500 },
    { name: "Spor Çantası Lacivert", price: 34900, cost: 14000 },
  ],
  Aksesuar: [
    { name: "Güneş Gözlüğü Siyah", price: 29900, cost: 11000 },
    { name: "Kemer Kahverengi", price: 19900, cost: 7500 },
    { name: "Şapka Bej", price: 14900, cost: 5500 },
    { name: "Eşarp Desenli", price: 22900, cost: 8800 },
    { name: "Gümüş Kolye", price: 39900, cost: 14000 },
  ],
  "Ev Tekstili": [
    { name: "Battaniye Çift Kişilik", price: 34900, cost: 14000 },
    { name: "Yastık 2'li Set", price: 19900, cost: 7800 },
    { name: "Havlu Seti 4'lü", price: 29900, cost: 12000 },
    { name: "Nevresim Takımı Çiçekli", price: 44900, cost: 18000 },
  ],
  Bebek: [
    { name: "Bebek Tulumu 0-6 Ay", price: 19900, cost: 8200 },
    { name: "Bebek Patiği", price: 9900, cost: 3800 },
    { name: "Bebek Body 3'lü", price: 24900, cost: 10000 },
  ],
  Hediye: [
    { name: "Mum Vanilya", price: 12900, cost: 4500 },
    { name: "Hediye Sepeti Klasik", price: 89900, cost: 38000 },
    { name: "Tasarım Defter", price: 14900, cost: 5800 },
  ],
};

// ─── Cleanup öncesi (full reset for realistic seed) ─────────────────────────

async function cleanup() {
  console.log("→ Eski veriler temizleniyor...");
  // Foreign-key sırası: child → parent
  await db.customerEmail.deleteMany({});
  await db.bankTransaction.deleteMany({});
  await db.autoPilotAction.deleteMany({});
  await db.invoice.deleteMany({});
  await db.refund.deleteMany({});
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.productReview.deleteMany({});
  await db.inventoryAdjustment.deleteMany({});
  await db.inventory.deleteMany({});
  await db.expense.deleteMany({});
  await db.scheduledPayment.deleteMany({});
  await db.discount.deleteMany({});
  await db.salesGoal.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  await db.customer.deleteMany({});
  await db.supplier.deleteMany({});
  await db.activityLog.deleteMany({});
  console.log("  ✓ Temiz");
}

// ─── Admin user (preserved) ─────────────────────────────────────────────────

async function ensureAdmin() {
  const password = await bcrypt.hash("demo1234", 12);
  await db.user.upsert({
    where: { email: "demo@commerceos.dev" },
    update: { hashedPassword: password, role: "ADMIN" },
    create: {
      email: "demo@commerceos.dev",
      name: "Demo Admin",
      hashedPassword: password,
      role: "ADMIN",
    },
  });
  console.log("  ✓ Admin: demo@commerceos.dev / demo1234");
}

// ─── Settings ───────────────────────────────────────────────────────────────

async function seedSettings() {
  await db.systemSettings.upsert({
    where: { id: "default" },
    update: {
      companyName: "Pamuk Tekstil A.Ş.",
      taxId: "1234567890",
      address: "Bağdat Caddesi No:127, Kadıköy, İstanbul",
      phone: "+90 216 555 00 12",
      email: "info@pamuktekstil.com.tr",
      defaultCurrency: "TRY",
      defaultTaxRate: 0.18,
      timezone: "Europe/Istanbul",
      gibMode: "test",
      bankMode: "test",
      bankName: "Garanti BBVA",
      bankAccountIban: "TR12 0006 2000 1234 5678 9012 34",
      autoPilotEnabled: false,
      autoPilotConfidenceThreshold: 75,
      onboardingCompletedAt: new Date(),
    },
    create: {
      id: "default",
      companyName: "Pamuk Tekstil A.Ş.",
      taxId: "1234567890",
      address: "Bağdat Caddesi No:127, Kadıköy, İstanbul",
      phone: "+90 216 555 00 12",
      email: "info@pamuktekstil.com.tr",
      defaultCurrency: "TRY",
      defaultTaxRate: 0.18,
      timezone: "Europe/Istanbul",
      gibMode: "test",
      bankMode: "test",
      bankName: "Garanti BBVA",
      bankAccountIban: "TR12 0006 2000 1234 5678 9012 34",
      autoPilotEnabled: false,
      autoPilotConfidenceThreshold: 75,
      onboardingCompletedAt: new Date(),
    },
  });
  console.log("  ✓ Settings: Pamuk Tekstil A.Ş.");
}

// ─── Categories + Products ──────────────────────────────────────────────────

async function seedCatalog() {
  const allProducts: { id: string; sku: string; price: number; cost: number; categoryId: string }[] = [];

  for (const [catName, products] of Object.entries(CATEGORY_PRODUCTS)) {
    const cat = await db.category.create({
      data: {
        name: catName,
        slug: slugify(catName),
      },
    });

    for (const p of products) {
      const sku = `PT-${slugify(p.name).slice(0, 20).toUpperCase()}-${randInt(100, 999)}`;
      const product = await db.product.create({
        data: {
          name: p.name,
          slug: slugify(p.name) + `-${randInt(100, 999)}`,
          sku,
          description: `${p.name} — premium kalite, hızlı kargo.`,
          price: p.price,
          costPrice: p.cost,
          currency: "TRY",
          status: "PUBLISHED",
          categoryId: cat.id,
          images: [],
          createdAt: dateNDaysAgo(randInt(180, 360)),
        },
      });

      // Inventory
      await db.inventory.create({
        data: {
          productId: product.id,
          quantity: randInt(10, 200),
          reorderLevel: randInt(5, 15),
        },
      });

      allProducts.push({
        id: product.id,
        sku,
        price: p.price,
        cost: p.cost,
        categoryId: cat.id,
      });
    }
  }

  console.log(`  ✓ ${Object.keys(CATEGORY_PRODUCTS).length} kategori, ${allProducts.length} ürün`);
  return allProducts;
}

// ─── Customers ──────────────────────────────────────────────────────────────

async function seedCustomers(): Promise<{ id: string; segment: string; email: string }[]> {
  const customers: { id: string; segment: string; email: string }[] = [];
  const total = 70;

  for (let i = 0; i < total; i++) {
    const first = pick(TR_FIRST_NAMES);
    const last = pick(TR_LAST_NAMES);
    const email = `${slugify(first + last)}${randInt(10, 999)}@${pick(["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"])}`;
    const city = pick(TR_CITIES);

    // Segment dağılımı: 40% sadık, 25% yeni, 20% VIP, 15% risky
    const r = Math.random();
    const segment =
      r < 0.4
        ? "sadık"
        : r < 0.65
          ? "yeni"
          : r < 0.85
            ? "VIP"
            : "risky";

    const c = await db.customer.create({
      data: {
        name: `${first} ${last}`,
        email,
        phone: `+90 5${randInt(10, 99)} ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}`,
        address: {
          line1: `${pick(STREETS)} No:${randInt(1, 250)}`,
          city,
          country: "Türkiye",
          postalCode: String(randInt(10000, 99999)),
        },
        aiSegment: segment,
        aiSegmentConfidence: randInt(70, 95),
        aiSegmentUpdatedAt: dateNDaysAgo(randInt(0, 90)),
        createdAt: dateNDaysAgo(randInt(0, 360)),
      },
    });
    customers.push({ id: c.id, segment, email });
  }

  console.log(`  ✓ ${total} müşteri (${customers.filter(c => c.segment === 'VIP').length} VIP)`);
  return customers;
}

// ─── Suppliers ──────────────────────────────────────────────────────────────

async function seedSuppliers(productSkus: string[]) {
  const suppliers = [
    {
      name: "Anadolu Tekstil A.Ş.",
      email: "siparis@anadolutekstil.com.tr",
      contactPerson: "Hasan Demir",
      skuCount: 8,
      leadTime: 7,
    },
    {
      name: "Marmara Tedarik",
      email: "order@marmaratedarik.com",
      contactPerson: "Ayşe Yılmaz",
      skuCount: 6,
      leadTime: 5,
    },
    {
      name: "Ege Konfeksiyon",
      email: "ege@egekonf.com.tr",
      contactPerson: "Mustafa Kaya",
      skuCount: 5,
      leadTime: 10,
    },
    {
      name: "İstanbul Aksesuar",
      email: "info@istakses.com",
      contactPerson: "Zeynep Aslan",
      skuCount: 4,
      leadTime: 4,
    },
    {
      name: "Karadeniz Ev Tekstili",
      email: "karadeniz@evtekstili.com.tr",
      contactPerson: "Mehmet Şahin",
      skuCount: 3,
      leadTime: 14,
    },
    {
      name: "Bebek Mamul Toptan",
      email: "siparis@bebekmamul.com",
      contactPerson: "Elif Çelik",
      skuCount: 3,
      leadTime: 6,
    },
  ];

  let skuIdx = 0;
  for (const s of suppliers) {
    const skus: string[] = [];
    for (let j = 0; j < s.skuCount && skuIdx < productSkus.length; j++) {
      skus.push(productSkus[skuIdx++]);
    }
    await db.supplier.create({
      data: {
        name: s.name,
        email: s.email,
        phone: `+90 212 555 ${randInt(10, 99)} ${randInt(10, 99)}`,
        contactPerson: s.contactPerson,
        address: `${pick(STREETS)} No:${randInt(1, 100)}, ${pick(TR_CITIES)}`,
        productSkus: skus,
        leadTimeDays: s.leadTime,
        isActive: true,
        notes: `Minimum sipariş ${randInt(50, 200)} adet, peşin ödemede %${randInt(3, 8)} indirim.`,
      },
    });
  }
  console.log(`  ✓ ${suppliers.length} tedarikçi`);
}

// ─── Discounts ──────────────────────────────────────────────────────────────

async function seedDiscounts() {
  const discounts = [
    {
      code: "YAZ2025",
      description: "Yaz İndirimi 2025",
      type: "PERCENTAGE" as const,
      value: 20,
      minSubtotal: 30000,
      startsAt: dateNDaysAgo(120),
      endsAt: dateNDaysAgo(60),
      maxRedemptions: 200,
      isActive: false,
    },
    {
      code: "BLACKFRIDAY",
      description: "Black Friday Kampanyası",
      type: "PERCENTAGE" as const,
      value: 35,
      minSubtotal: 50000,
      startsAt: dateNDaysAgo(15),
      endsAt: dateNDaysAgo(10),
      maxRedemptions: 500,
      isActive: false,
    },
    {
      code: "YENIYIL",
      description: "Yeni Yıl Hediyesi",
      type: "PERCENTAGE" as const,
      value: 15,
      minSubtotal: 0,
      startsAt: new Date(),
      endsAt: dateNDaysAgo(-30),
      maxRedemptions: 1000,
      isActive: true,
    },
    {
      code: "SADIK10",
      description: "Sadık Müşterilere Özel",
      type: "FIXED" as const,
      value: 5000,
      minSubtotal: 20000,
      startsAt: dateNDaysAgo(180),
      endsAt: dateNDaysAgo(-60),
      isActive: true,
    },
  ];

  for (const d of discounts) {
    await db.discount.create({ data: d });
  }
  console.log(`  ✓ ${discounts.length} indirim kodu`);
}

// ─── Orders + Items + Invoices ──────────────────────────────────────────────

async function seedOrders(
  customers: { id: string; segment: string }[],
  products: { id: string; sku: string; price: number; cost: number }[],
) {
  let orderCount = 0;
  let invoiceCount = 0;

  // 12 ay boyunca dağıt
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseOrders = 35; // ortalama aylık
    const seasonal = SEASONAL_MULTIPLIERS[(new Date().getMonth() - monthsAgo + 12) % 12] ?? 1;
    const monthOrderCount = Math.round(baseOrders * seasonal);

    for (let i = 0; i < monthOrderCount; i++) {
      // Bu ay içinde rastgele gün/saat
      const dayInMonth = randInt(0, 28);
      const orderDate = new Date();
      orderDate.setMonth(orderDate.getMonth() - monthsAgo);
      orderDate.setDate(dayInMonth + 1);
      orderDate.setHours(randInt(8, 22), randInt(0, 59));
      // Geleceğe sarkmasın — clamp to now (admin sıralamasını bozmasın)
      const now = new Date();
      if (orderDate > now) orderDate.setTime(now.getTime() - randInt(60, 3600) * 1000);

      // VIP/sadık müşteri %50 olasılıkla, yeni/risky %50
      const customer =
        Math.random() < 0.55
          ? pick(customers.filter((c) => c.segment === "VIP" || c.segment === "sadık"))
          : pick(customers);

      // Sipariş kalemleri (1-4 ürün)
      const itemCount = randInt(1, 4);
      const orderProducts = randomPick(products, itemCount);

      let subtotal = 0;
      const items = orderProducts.map((p) => {
        const qty = randInt(1, 3);
        const total = p.price * qty;
        subtotal += total;
        return {
          productId: p.id,
          name: `Ürün-${p.sku}`, // simplification
          unitPrice: p.price,
          quantity: qty,
          total,
        };
      });

      const tax = Math.round(subtotal * 0.18);
      const shipping = subtotal > 25000 ? 0 : 4900;
      const total = subtotal + tax + shipping;

      // Status: orderDate eski ise daha çok DELIVERED, yeni ise çoğu PENDING/CONFIRMED
      const ageInDays = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      const statusRoll = Math.random();
      let status:
        | "PENDING"
        | "CONFIRMED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "REFUNDED";
      if (ageInDays < 3) {
        status = statusRoll < 0.3 ? "PENDING" : statusRoll < 0.7 ? "CONFIRMED" : "SHIPPED";
      } else if (ageInDays < 14) {
        status = statusRoll < 0.6 ? "DELIVERED" : statusRoll < 0.8 ? "SHIPPED" : "CONFIRMED";
      } else {
        status =
          statusRoll < 0.85
            ? "DELIVERED"
            : statusRoll < 0.9
              ? "REFUNDED"
              : statusRoll < 0.95
                ? "CANCELLED"
                : "DELIVERED";
      }

      // Kargo bilgisi (SHIPPED+)
      const isShipped = status === "SHIPPED" || status === "DELIVERED";
      const carriers = ["ARAS", "YURTICI", "MNG", "PTT"];
      const carrier = isShipped ? pick(carriers) : null;
      const trackingNumber = isShipped
        ? `${carrier?.slice(0, 2)}${Date.now().toString(36).toUpperCase()}${randInt(1000, 9999)}`
        : null;
      const shippedAt = isShipped
        ? new Date(orderDate.getTime() + randInt(1, 3) * 24 * 60 * 60 * 1000)
        : null;
      const deliveredAt =
        status === "DELIVERED"
          ? new Date(
              (shippedAt?.getTime() ?? orderDate.getTime()) +
                randInt(2, 5) * 24 * 60 * 60 * 1000,
            )
          : null;

      const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderCount + 1).padStart(5, "0")}`;

      const order = await db.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status,
          subtotal,
          tax,
          shipping,
          total,
          currency: "TRY",
          carrier,
          trackingNumber,
          shippedAt,
          deliveredAt,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: { create: items },
        },
      });

      // CONFIRMED+ ise %80 fatura kes
      if (
        status !== "PENDING" &&
        status !== "CANCELLED" &&
        Math.random() < 0.8
      ) {
        const documentType = customer.segment === "VIP" ? "EFATURA" : "EARSIV";
        const invoiceNumber = `GIB-${orderDate.getFullYear()}${String(invoiceCount + 1).padStart(7, "0")}`;
        const uuid = `${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 14)}`;

        await db.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            status: status === "REFUNDED" ? "CANCELLED" : "ACCEPTED",
            documentType,
            ublXml: `<?xml version="1.0"?><Invoice><InvoiceNumber>${invoiceNumber}</InvoiceNumber><Total>${total}</Total></Invoice>`,
            uuid,
            totalMinor: total,
            taxMinor: tax,
            currency: "TRY",
            mode: "test",
            sentAt: new Date(orderDate.getTime() + 60_000),
            acceptedAt: new Date(orderDate.getTime() + 90_000),
            createdAt: orderDate,
          },
        });
        invoiceCount++;
      }

      orderCount++;
    }
  }

  console.log(`  ✓ ${orderCount} sipariş, ${invoiceCount} fatura`);
  return { orderCount, invoiceCount };
}

// ─── Reviews ────────────────────────────────────────────────────────────────

async function seedReviews(products: { id: string }[]) {
  const positiveBodies = [
    "Ürün tam beklediğim gibi çıktı, kargo da hızlıydı, teşekkürler!",
    "Kalitesi fiyatına göre çok iyi, kesinlikle tavsiye ederim.",
    "İkinci kez sipariş veriyorum, hiçbir sorun yok.",
    "Çok memnun kaldım, paketleme de özenliydi.",
    "Hediye için aldım, beğenildi, tekrar alacağım.",
    "Bedeni tam, kumaşı yumuşak, harika.",
    "5 yıldız, kesinlikle hak ediyor.",
  ];
  const neutralBodies = [
    "Beden bana büyük geldi, iade etmek istiyorum.",
    "Renk fotoğraftakinden biraz farklı ama yine de güzel.",
    "Ortalama bir ürün, fiyatı kadar.",
  ];
  const negativeBodies = [
    "Kargo çok geç geldi, ürün kötü değil ama beklerken sıkıldım.",
    "İkinci yıkamada söküldü, kalite düşük.",
    "Beklediğim gibi çıkmadı, iade ediyorum.",
    "Sipariş eksik geldi, müşteri hizmetleri ulaşamadım.",
  ];

  const total = 200;
  let withReply = 0;
  let flagged = 0;

  for (let i = 0; i < total; i++) {
    const product = pick(products);
    const ratingRoll = Math.random();
    let rating: number;
    let body: string;
    if (ratingRoll < 0.65) {
      rating = randInt(4, 5);
      body = pick(positiveBodies);
    } else if (ratingRoll < 0.85) {
      rating = 3;
      body = pick(neutralBodies);
    } else {
      rating = randInt(1, 2);
      body = pick(negativeBodies);
    }

    const first = pick(TR_FIRST_NAMES);
    const last = pick(TR_LAST_NAMES);

    // %50 olasılıkla AI cevap
    const hasReply = Math.random() < 0.5;
    const isFlagged = rating <= 2;

    await db.productReview.create({
      data: {
        productId: product.id,
        authorName: `${first} ${last}`,
        authorEmail: `${slugify(first + last)}${randInt(10, 99)}@example.com`,
        rating,
        body,
        reply: hasReply
          ? rating >= 4
            ? "Yorumunuz için çok teşekkür ederiz! Memnun kaldığınızı duymak harika."
            : "Yaşadığınız deneyim için üzgünüz. Müşteri hizmetlerimiz sizinle iletişime geçecek."
          : null,
        repliedAt: hasReply ? dateNDaysAgo(randInt(0, 30)) : null,
        aiFlagged: isFlagged,
        aiFlagReason: isFlagged ? pick(["şikayet", "kargo sorunu", "kalite", "iade talebi"]) : null,
        aiFlagSentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
        isPublished: true,
        createdAt: dateNDaysAgo(randInt(0, 350)),
      },
    });

    if (hasReply) withReply++;
    if (isFlagged) flagged++;
  }

  console.log(`  ✓ ${total} yorum (${withReply} cevaplı, ${flagged} flag'li)`);
}

// ─── Expenses (recurring + ad-hoc) ──────────────────────────────────────────

async function seedExpenses(adminId: string | null) {
  let count = 0;

  // 1. Recurring template'ler
  const recurringTemplates = [
    { description: "Aylık Dükkan Kirası", amount: 1500000, category: "RENT", rule: "MONTHLY", vendor: "Mülk Sahibi" },
    { description: "Personel Maaşları", amount: 4500000, category: "PAYROLL", rule: "MONTHLY", vendor: "Personel" },
    { description: "Elektrik Faturası", amount: 180000, category: "UTILITIES", rule: "MONTHLY", vendor: "Boğaziçi Elektrik" },
    { description: "İnternet & Telefon", amount: 95000, category: "UTILITIES", rule: "MONTHLY", vendor: "Türk Telekom" },
    { description: "SaaS Abonelikleri (Shopify, Mailchimp, vs.)", amount: 75000, category: "SOFTWARE", rule: "MONTHLY", vendor: "Çeşitli" },
    { description: "Vergi Beyanı (KDV)", amount: 280000, category: "TAXES", rule: "MONTHLY", vendor: "Maliye Bakanlığı" },
  ];

  // Her template için template + 11 ay türev oluştur
  for (const t of recurringTemplates) {
    const templateDate = dateNDaysAgo(360);
    const template = await db.expense.create({
      data: {
        date: templateDate,
        amount: t.amount,
        currency: "TRY",
        category: t.category as never,
        description: t.description,
        vendor: t.vendor,
        recurringRule: t.rule,
        userId: adminId,
        createdAt: templateDate,
      },
    });
    count++;

    // 11 türev (her ay)
    for (let m = 1; m <= 11; m++) {
      const date = new Date(templateDate);
      date.setMonth(date.getMonth() + m);
      // Bazen +/-%5 varyasyon
      const variance = 1 + (Math.random() - 0.5) * 0.1;
      await db.expense.create({
        data: {
          date,
          amount: Math.round(t.amount * variance),
          currency: "TRY",
          category: t.category as never,
          description: `${t.description} (${date.toLocaleString("tr-TR", { month: "long", year: "numeric" })})`,
          vendor: t.vendor,
          recurringParentId: template.id,
          userId: adminId,
          createdAt: date,
        },
      });
      count++;
    }
  }

  // 2. Ad-hoc giderler
  const adhocCategories = [
    { cat: "MARKETING", desc: "Instagram reklam kampanyası", min: 50000, max: 350000 },
    { cat: "MARKETING", desc: "Google Ads", min: 30000, max: 200000 },
    { cat: "SHIPPING", desc: "Aras Kargo aylık ödeme", min: 80000, max: 250000 },
    { cat: "SUPPLIES", desc: "Paketleme malzemesi", min: 5000, max: 30000 },
    { cat: "SUPPLIES", desc: "Ofis kırtasiye", min: 2000, max: 15000 },
    { cat: "COGS", desc: "Hammadde alımı (Anadolu Tekstil)", min: 200000, max: 1500000 },
    { cat: "TRAVEL", desc: "Tedarikçi ziyareti — Bursa", min: 15000, max: 50000 },
    { cat: "OTHER", desc: "Banka komisyonları", min: 5000, max: 20000 },
  ];

  const adhocCount = 130;
  for (let i = 0; i < adhocCount; i++) {
    const tpl = pick(adhocCategories);
    const date = dateNDaysAgo(randInt(0, 360));
    await db.expense.create({
      data: {
        date,
        amount: randInt(tpl.min, tpl.max),
        currency: "TRY",
        category: tpl.cat as never,
        description: tpl.desc,
        vendor: tpl.desc.includes("Aras")
          ? "Aras Kargo"
          : tpl.desc.includes("Instagram")
            ? "Meta"
            : tpl.desc.includes("Google")
              ? "Google"
              : null,
        userId: adminId,
        createdAt: date,
      },
    });
    count++;
  }

  console.log(`  ✓ ${count} gider (${recurringTemplates.length} recurring template + ${count - recurringTemplates.length * 12} ad-hoc)`);
}

// ─── Scheduled Payments (kira, maaş, vergi vb. gelecek ödemeler) ────────────

async function seedScheduledPayments() {
  const items = [
    // Personel — kişi başına ayrı kayıt (CFO görünürlüğü için)
    { name: "Maaş — Ali Yılmaz", amount: 1850000, category: "PAYROLL", dueDay: 5, vendor: "Ali Yılmaz", notes: "Operasyon müdürü" },
    { name: "Maaş — Ayşe Demir", amount: 1250000, category: "PAYROLL", dueDay: 5, vendor: "Ayşe Demir", notes: "Satış sorumlusu" },
    { name: "Maaş — Mehmet Kaya", amount: 900000, category: "PAYROLL", dueDay: 5, vendor: "Mehmet Kaya", notes: "Depo görevlisi" },
    { name: "Maaş — Zeynep Aydın", amount: 850000, category: "PAYROLL", dueDay: 5, vendor: "Zeynep Aydın", notes: "Müşteri hizmetleri" },
    { name: "Maaş — Burak Şen", amount: 750000, category: "PAYROLL", dueDay: 5, vendor: "Burak Şen", notes: "Kargo & paketleme" },
    { name: "Maaş — Elif Korkmaz", amount: 700000, category: "PAYROLL", dueDay: 5, vendor: "Elif Korkmaz", notes: "Sosyal medya" },
    // Diğer sabit giderler
    { name: "Dükkan kirası", amount: 1750000, category: "RENT", dueDay: 1, vendor: "Mülk sahibi", notes: "Levent şube" },
    { name: "KDV beyanı", amount: 350000, category: "TAXES", dueDay: 26, vendor: "GİB", notes: "Aylık KDV" },
    { name: "SGK primi", amount: 720000, category: "TAXES", dueDay: 23, vendor: "SGK", notes: "Personel SGK" },
    { name: "İnternet + telefon", amount: 95000, category: "UTILITIES", dueDay: 15, vendor: "Türk Telekom", notes: "Fiber 1000" },
    { name: "Elektrik faturası", amount: 220000, category: "UTILITIES", dueDay: 18, vendor: "BEDAŞ", notes: "Aylık ticari" },
    { name: "SaaS abonelikleri", amount: 88000, category: "SOFTWARE", dueDay: 10, vendor: "Çeşitli", notes: "Shopify+Mailchimp+Klaviyo" },
    { name: "Kargo sözleşmesi avansı", amount: 250000, category: "SHIPPING", dueDay: 8, vendor: "Aras Kargo", notes: "Aylık avans" },
  ];
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  for (const it of items) {
    const start = new Date(startOfYear);
    start.setDate(it.dueDay);
    await db.scheduledPayment.create({
      data: {
        name: it.name,
        amount: it.amount,
        currency: "TRY",
        category: it.category as never,
        recurrence: "MONTHLY",
        dueDay: it.dueDay,
        startDate: start,
        endDate: null,
        active: true,
        vendor: it.vendor,
        notes: it.notes,
      },
    });
  }
  console.log(`  ✓ ${items.length} gelecek/tekrarlayan ödeme`);
}

// ─── Sales Goals ────────────────────────────────────────────────────────────

async function seedGoals() {
  const now = new Date();
  for (let monthsAgo = 11; monthsAgo >= -1; monthsAgo--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - monthsAgo);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const seasonal = SEASONAL_MULTIPLIERS[d.getMonth()] ?? 1;
    const target = Math.round(2_500_000 * seasonal); // baseline 25K TL

    await db.salesGoal.upsert({
      where: { period },
      update: { targetAmount: target },
      create: {
        period,
        targetAmount: target,
        notes: `${d.toLocaleString("tr-TR", { month: "long", year: "numeric" })} hedefi`,
      },
    });
  }
  console.log(`  ✓ 13 aylık satış hedefi`);
}

// ─── Bank Transactions ──────────────────────────────────────────────────────

async function seedBankTransactions(orders: string[]) {
  let matched = 0;
  let unmatched = 0;

  // Matched: 60 sipariş için tahsilat (random pick)
  const matchedOrders = randomPick(orders, Math.min(60, orders.length));

  for (const orderId of matchedOrders) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) continue;
    const txDate = new Date(order.createdAt);
    txDate.setHours(txDate.getHours() + randInt(2, 48));

    await db.bankTransaction.create({
      data: {
        bankName: "Garanti BBVA",
        accountIban: "TR12 0006 2000 1234 5678 9012 34",
        reference: `EFT${Date.now().toString(36).toUpperCase().slice(-8)}${randInt(100, 999)}`,
        transactionDate: txDate,
        amountMinor: order.total,
        currency: "TRY",
        description: `${order.orderNumber} sipariş ödemesi`,
        direction: "IN",
        source: pick(["CSV", "WEBHOOK"]),
        status: pick(["AUTO_MATCHED", "MANUAL_MATCHED"]) as never,
        matchedOrderId: order.id,
        matchConfidence: randInt(85, 99),
        matchReasoning: "Sipariş no açıklamada geçti, tutar tam eşleşti.",
        matchedAt: txDate,
        matchedBy: "AI",
        createdAt: txDate,
      },
    });
    matched++;
  }

  // Unmatched: 20 random tahsilat (sipariş bağlanmamış)
  for (let i = 0; i < 20; i++) {
    const txDate = dateNDaysAgo(randInt(0, 90));
    await db.bankTransaction.create({
      data: {
        bankName: "Garanti BBVA",
        accountIban: "TR12 0006 2000 1234 5678 9012 34",
        reference: `EFT${Date.now().toString(36).toUpperCase().slice(-8)}${randInt(100, 999)}-${i}`,
        transactionDate: txDate,
        amountMinor: randInt(10000, 200000),
        currency: "TRY",
        description: pick([
          "Havale",
          "Müşteri ödemesi",
          "Banka transferi",
          "EFT alımı",
          "Açıklamasız transfer",
        ]),
        direction: "IN",
        source: "CSV",
        status: "UNMATCHED",
        createdAt: txDate,
      },
    });
    unmatched++;
  }

  // Birkaç OUT (komisyon, banka transferi)
  for (let i = 0; i < 8; i++) {
    const txDate = dateNDaysAgo(randInt(0, 360));
    await db.bankTransaction.create({
      data: {
        bankName: "Garanti BBVA",
        accountIban: "TR12 0006 2000 1234 5678 9012 34",
        reference: `OUT${Date.now().toString(36).toUpperCase().slice(-8)}-${i}`,
        transactionDate: txDate,
        amountMinor: -randInt(5000, 50000),
        currency: "TRY",
        description: pick([
          "Banka komisyonu",
          "Hesap işletim ücreti",
          "POS komisyon kesintisi",
        ]),
        direction: "OUT",
        source: "CSV",
        status: "IGNORED",
        createdAt: txDate,
      },
    });
  }

  console.log(`  ✓ ${matched + unmatched + 8} banka tx (${matched} matched, ${unmatched} unmatched, 8 out)`);
}

// ─── Customer Emails ────────────────────────────────────────────────────────

async function seedCustomerEmails(customers: { id: string }[]) {
  const campaigns = [
    {
      tag: "yaz-kampanya-2025",
      subject: "Yaz İndirimi Sona Eriyor! %20 Daha",
      body: "Merhaba,\n\nYaz koleksiyonumuzdaki tüm ürünlerde %20 indirim sona eriyor...",
      customerCount: 30,
    },
    {
      tag: "blackfriday-2025",
      subject: "Black Friday'e Saatler Kaldı!",
      body: "Merhaba,\n\n%35'e varan indirimleri kaçırma...",
      customerCount: 50,
    },
    {
      tag: "sadik-2025",
      subject: "Sadık Müşterilerimize Özel: SADIK10",
      body: "Merhaba,\n\n5000 TL indirim kuponunuz hazır...",
      customerCount: 25,
    },
  ];

  let total = 0;
  for (const c of campaigns) {
    const targets = randomPick(customers, c.customerCount);
    for (const customer of targets) {
      await db.customerEmail.create({
        data: {
          customerId: customer.id,
          subject: c.subject,
          body: c.body,
          status: "SENT",
          campaignTag: c.tag,
          sentAt: dateNDaysAgo(randInt(0, 90)),
          createdAt: dateNDaysAgo(randInt(0, 90)),
        },
      });
      total++;
    }
  }

  console.log(`  ✓ ${total} email log (${campaigns.length} kampanya)`);
}

// ─── AutoPilot history ─────────────────────────────────────────────────────

async function seedAutoPilot() {
  const types = [
    "REVIEW_REPLY",
    "INVOICE_ISSUE",
    "STOCK_REORDER",
    "BANK_MATCH",
    "ORDER_CONFIRM",
  ] as const;

  for (let i = 0; i < 30; i++) {
    const type = pick(types as unknown as string[]);
    const date = dateNDaysAgo(randInt(0, 90));
    const decisions: Record<string, string> = {
      REVIEW_REPLY: "Yorum cevabı yazıldı (215 karakter)",
      INVOICE_ISSUE: `E-fatura kesildi: GIB-${randInt(2025, 2026)}${randInt(100000, 999999)}`,
      STOCK_REORDER: "Anadolu Tekstil → 50 adet sipariş maili",
      BANK_MATCH: "Havale eşleştirildi (%92 güven)",
      ORDER_CONFIRM: "Sipariş otomatik onaylandı",
    };
    await db.autoPilotAction.create({
      data: {
        type: type as never,
        triggerSource: `${type.toLowerCase()}:auto-${i}`,
        triggerSummary: `Otopilot demo aksiyon ${i}`,
        decision: decisions[type] ?? "Aksiyon",
        confidence: randInt(78, 96),
        status: "EXECUTED",
        executedAt: date,
        createdAt: date,
      },
    });
  }
  console.log(`  ✓ 30 otopilot aksiyon geçmişi`);
}

// ─── Activity Log ───────────────────────────────────────────────────────────

async function seedActivity() {
  const actions = [
    "product.create",
    "order.create",
    "order.transition",
    "expense.create",
    "review.create",
    "review.reply",
    "invoice.issued",
    "campaign.email_sent",
  ];

  for (let i = 0; i < 80; i++) {
    const date = dateNDaysAgo(randInt(0, 90));
    await db.activityLog.create({
      data: {
        action: pick(actions),
        userName: "Demo Admin",
        metadata: { auto: false },
        createdAt: date,
      },
    });
  }
  console.log(`  ✓ 80 activity log`);
}

// ─── Ana akış ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Realistic seed başlıyor (1 yıllık veri)...\n");

  await cleanup();
  await ensureAdmin();
  await seedSettings();
  const products = await seedCatalog();
  const customers = await seedCustomers();
  await seedSuppliers(products.map((p) => p.sku));
  await seedDiscounts();

  const { orderCount } = await seedOrders(customers, products);
  await seedReviews(products);

  // Admin id
  const admin = await db.user.findUnique({
    where: { email: "demo@commerceos.dev" },
  });
  await seedExpenses(admin?.id ?? null);
  await seedScheduledPayments();
  await seedGoals();

  // Bank tx için order id'leri
  const allOrders = await db.order.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  await seedBankTransactions(allOrders.map((o) => o.id));

  await seedCustomerEmails(customers);
  await seedAutoPilot();
  await seedActivity();

  console.log("\n✨ Seed tamamlandı!");
  console.log(`Toplam: 70 müşteri · 40 ürün · ${orderCount} sipariş`);
  console.log("Login: demo@commerceos.dev / demo1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
