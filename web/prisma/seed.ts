import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/**
 * Idempotent demo seed. Safe to run repeatedly — every record is upserted
 * by a stable natural key (email, slug, sku, orderNumber).
 *
 *   pnpm db:seed
 */
async function main() {
  console.log("→ Seeding admin users…");
  const adminPassword = await bcrypt.hash("demo1234", 12);
  await db.user.upsert({
    where: { email: "demo@commerceos.dev" },
    update: { hashedPassword: adminPassword, role: "ADMIN" },
    create: {
      email: "demo@commerceos.dev",
      name: "Demo Admin",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("→ Seeding categories…");
  const clothing = await db.category.upsert({
    where: { slug: "kiyafet" },
    update: {},
    create: { name: "Kıyafet", slug: "kiyafet" },
  });
  const tshirts = await db.category.upsert({
    where: { slug: "tisort" },
    update: { parentId: clothing.id },
    create: { name: "Tişört", slug: "tisort", parentId: clothing.id },
  });
  const kitchen = await db.category.upsert({
    where: { slug: "mutfak" },
    update: {},
    create: { name: "Mutfak", slug: "mutfak" },
  });
  const accessories = await db.category.upsert({
    where: { slug: "aksesuar" },
    update: {},
    create: { name: "Aksesuar", slug: "aksesuar" },
  });

  console.log("→ Seeding products…");
  const products = [
    {
      sku: "TS-001",
      slug: "premium-pamuklu-tisort",
      name: "Premium Pamuklu Tişört",
      price: 29900,
      categoryId: tshirts.id,
      status: "PUBLISHED" as const,
      stock: 120,
    },
    {
      sku: "TS-002",
      slug: "vintage-baskili-tisort",
      name: "Vintage Baskılı Tişört",
      price: 34900,
      categoryId: tshirts.id,
      status: "PUBLISHED" as const,
      stock: 4,
    },
    {
      sku: "MG-001",
      slug: "celik-cift-cidarli-bardak",
      name: "Çelik Çift Cidarlı Bardak",
      price: 24900,
      categoryId: kitchen.id,
      status: "PUBLISHED" as const,
      stock: 0,
    },
    {
      sku: "BG-001",
      slug: "tuval-bel-cantasi",
      name: "Tuval Bel Çantası",
      price: 49900,
      categoryId: accessories.id,
      status: "PUBLISHED" as const,
      stock: 35,
    },
    {
      sku: "MG-002",
      slug: "porselen-kahve-fincani",
      name: "Porselen Kahve Fincanı",
      price: 14900,
      categoryId: kitchen.id,
      status: "DRAFT" as const,
      stock: 0,
    },
  ];

  const productRecords = await Promise.all(
    products.map((p) =>
      db.product.upsert({
        where: { sku: p.sku },
        update: {
          name: p.name,
          slug: p.slug,
          price: p.price,
          status: p.status,
          categoryId: p.categoryId,
        },
        create: {
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          price: p.price,
          currency: "TRY",
          status: p.status,
          categoryId: p.categoryId,
          inventory: { create: { quantity: p.stock, reorderLevel: 10 } },
        },
      })
    )
  );

  // Make sure inventory matches the seeded stock even on reruns.
  for (let i = 0; i < products.length; i++) {
    await db.inventory.upsert({
      where: { productId: productRecords[i].id },
      update: { quantity: products[i].stock, reorderLevel: 10 },
      create: {
        productId: productRecords[i].id,
        quantity: products[i].stock,
        reorderLevel: 10,
      },
    });
  }

  console.log("→ Seeding customers…");
  const customers = [
    { email: "ada@example.com", name: "Ada Yıldız", phone: "+90 555 010 20 30" },
    { email: "berk@example.com", name: "Berk Demir", phone: "+90 555 040 50 60" },
    { email: "cem@example.com", name: "Cem Aslan", phone: "+90 555 070 80 90" },
  ];

  const customerRecords = await Promise.all(
    customers.map((c) =>
      db.customer.upsert({
        where: { email: c.email },
        update: { name: c.name, phone: c.phone },
        create: { ...c, address: { city: "İstanbul", country: "Türkiye" } },
      })
    )
  );

  console.log("→ Seeding orders…");
  const orderTemplates = [
    {
      orderNumber: "ORD-DEMO-0001",
      customerId: customerRecords[0].id,
      status: "DELIVERED" as const,
      lines: [
        { product: productRecords[0], quantity: 2 },
        { product: productRecords[3], quantity: 1 },
      ],
    },
    {
      orderNumber: "ORD-DEMO-0002",
      customerId: customerRecords[1].id,
      status: "SHIPPED" as const,
      lines: [{ product: productRecords[1], quantity: 1 }],
    },
    {
      orderNumber: "ORD-DEMO-0003",
      customerId: customerRecords[2].id,
      status: "PENDING" as const,
      lines: [{ product: productRecords[3], quantity: 1 }],
    },
  ];

  for (const o of orderTemplates) {
    const items = o.lines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      quantity: l.quantity,
      unitPrice: l.product.price,
      total: l.product.price * l.quantity,
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);

    await db.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: { status: o.status },
      create: {
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        status: o.status,
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
        currency: "TRY",
        items: { create: items },
      },
    });
  }

  console.log("→ Seeding product reviews…");
  // SKU bazında ürünleri yorum eşleştirmesi için sözlük.
  const bySku = new Map(productRecords.map((p) => [p.sku, p]));

  const reviewTemplates: Array<{
    sku: string;
    rating: number;
    authorName: string;
    body: string;
    isPublished?: boolean;
  }> = [
    // Premium Pamuklu Tişört (TS-001) — çoğunlukla pozitif
    {
      sku: "TS-001",
      rating: 5,
      authorName: "Ada Yıldız",
      body: "Pamuğu çok yumuşak, ilk yıkamadan sonra hiç çekme yapmadı. Kesimi de dediğiniz gibi tam slim. Renk koyu beyaz, fotoğraftaki gibi. Bir tane daha sipariş edeceğim.",
    },
    {
      sku: "TS-001",
      rating: 4,
      authorName: "Mert Kılıç",
      body: "Genel olarak memnunum, kalitesi fiyatına göre iyi. Tek dezavantajı kollar bana biraz uzun geldi ama bu kişisel.",
    },
    {
      sku: "TS-001",
      rating: 5,
      authorName: "Selin Demir",
      body: "İkinci kez sipariş ettim. İlki bir buçuk yıl boyunca yıkana yıkana hâlâ form bozulmadı. Çok teşekkürler.",
    },
    {
      sku: "TS-001",
      rating: 2,
      authorName: "Burak Aksoy",
      body: "Kargo 6 gün sürdü, web sitesinde 'ertesi gün' yazıyordu. Ürün fena değil ama bu süre çok abartı. Bir daha düşünürüm.",
    },

    // Vintage Baskılı Tişört (TS-002) — karışık
    {
      sku: "TS-002",
      rating: 5,
      authorName: "Ece Yılmaz",
      body: "Baskı çok kaliteli, ilk yıkamada hiç solmadı. Vintage hissini güzel veriyor. Kombin için harika.",
    },
    {
      sku: "TS-002",
      rating: 3,
      authorName: "Onur Çelik",
      body: "Baskı güzel ama tişörtün kendisi biraz ince. Yaz için iyi olabilir, kışın altına bir şey lazım.",
    },
    {
      sku: "TS-002",
      rating: 1,
      authorName: "Pelin K.",
      body: "Yanlış beden geldi. M sipariş verdim, S geldi. Müşteri hizmetlerine yazdım, geri dönüş çok yavaş. Bu konuda iyileşme şart.",
    },

    // Çelik Çift Cidarlı Bardak (MG-001)
    {
      sku: "MG-001",
      rating: 5,
      authorName: "Hakan Ş.",
      body: "Sıcağı 4 saat boyunca tuttu, beklediğimden iyi. Kapağı biraz tıklatmaya alışmak gerekiyor ama kullanışlı.",
    },
    {
      sku: "MG-001",
      rating: 4,
      authorName: "Defne Arslan",
      body: "Çok beğendim, ofiste her gün kullanıyorum. Tek not: bulaşık makinesinde olabildiğince üst raf öneriyorum, alttaki sıcak su biraz boyayı solduruyor.",
    },
    {
      sku: "MG-001",
      rating: 5,
      authorName: "Cem Oktay",
      body: "Tam istediğim gibi. Hediye olarak da aldım, çok beğenildi.",
    },

    // Tuval Bel Çantası (BG-001)
    {
      sku: "BG-001",
      rating: 4,
      authorName: "Zeynep Polat",
      body: "Boyu tam istediğim gibi, telefon + cüzdan + anahtar + hatta küçük bir defter sığıyor. Tuval kalitesi solid.",
    },
    {
      sku: "BG-001",
      rating: 5,
      authorName: "Tolga İnan",
      body: "Yürüyüşlerde sürekli kullanıyorum, kayışı sağlam. Renk de güzel duruyor, pörselensiz tutuyor.",
    },
    {
      sku: "BG-001",
      rating: 2,
      authorName: "Hande G.",
      body: "Fermuarı bir hafta sonra tutukluk yapmaya başladı. İade etmek istiyorum ama formu kafa karıştırıcı, açıklama eksik.",
      isPublished: false,
    },

    // Porselen Kahve Fincanı (MG-002) — DRAFT product, az yorum
    {
      sku: "MG-002",
      rating: 5,
      authorName: "Ali Vural",
      body: "Henüz piyasada değil ama deneme örneği bende, espressonun ağzını çok güzel tutuyor.",
      isPublished: false,
    },
  ];

  // Idempotent kontrol: aynı (productId + authorName + body[0:40]) varsa atla.
  for (const r of reviewTemplates) {
    const product = bySku.get(r.sku);
    if (!product) continue;

    const existing = await db.productReview.findFirst({
      where: {
        productId: product.id,
        authorName: r.authorName,
        body: { startsWith: r.body.slice(0, 40) },
      },
      select: { id: true },
    });

    if (existing) continue;

    await db.productReview.create({
      data: {
        productId: product.id,
        authorName: r.authorName,
        rating: r.rating,
        body: r.body,
        isPublished: r.isPublished ?? true,
      },
    });
  }

  const reviewCount = await db.productReview.count();
  console.log(`✓ Seed complete.`);
  console.log("  Admin:    demo@commerceos.dev / demo1234");
  console.log("  Products: 5 (1 düşük stok, 1 tükendi)");
  console.log("  Orders:   3 (DELIVERED, SHIPPED, PENDING)");
  console.log(`  Reviews:  ${reviewCount} (yayında + taslak karışık)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
