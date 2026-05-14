/**
 * Production seed for the Pamuk clothing brand demo.
 *
 *  1. Wipes shop-facing data (customers, products, orders, bank, reviews…)
 *  2. Seeds 5 months of realistic activity:
 *      - 8 categories (kıyafet odaklı)
 *      - 40 ürün (her birinde Higgsfield ile üretilmiş görsel)
 *      - ~85 müşteri (Türkçe isimler, ~10 VIP repeat buyer)
 *      - ~300 sipariş (Dec 2025 → May 2026, büyüme eğrisi)
 *      - Sipariş kalemleri, faturalar, iadeler
 *      - Bank transactions (in + out) — siparişlerle eşleşmiş
 *      - Ürün yorumları (DELIVERED siparişlerin yaklaşık yarısı)
 *      - Tedarikçiler, giderler, sales goals
 *
 *  KORUNANLAR: User (admin), SystemSettings, AgentTask (admin/agent demo).
 *
 *  SAFETY: Runs only when SEED_FORCE=1 — production wipe yanlışlıkla
 *  tetiklenmesin.
 *
 *  Kullanım:
 *    SEED_FORCE=1 pnpm tsx --env-file=.env prisma/seed-pamuk-production.ts
 */
import { PrismaClient, ProductStatus, OrderStatus, BankTransactionDirection, BankTransactionStatus } from "@prisma/client";

const db = new PrismaClient();

// ───────────────────────── Helpers ─────────────────────────

function rng(seed: number) {
  // Deterministik rastgele — aynı tohumla aynı dataset
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rand = rng(20260513);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rand() * copy.length);
    out.push(copy[i]);
    copy.splice(i, 1);
  }
  return out;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function daysAgo(d: number, hours = 0): Date {
  return new Date(Date.now() - d * 86_400_000 - hours * 3_600_000);
}

// ───────────────────────── Catalog ─────────────────────────

const CATEGORIES = [
  { slug: "tisort", name: "Tişört" },
  { slug: "gomlek", name: "Gömlek" },
  { slug: "sweat-kazak", name: "Sweat & Kazak" },
  { slug: "pantolon", name: "Pantolon" },
  { slug: "elbise", name: "Elbise" },
  { slug: "etek", name: "Etek" },
  { slug: "aksesuar", name: "Aksesuar" },
  { slug: "canta", name: "Çanta" },
] as const;

type ProductSeed = {
  sku: string;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  costMinor: number;
  category: typeof CATEGORIES[number]["slug"];
  imageUrl: string;
  stock: number;
  status?: ProductStatus;
};

// imageUrl alanları seed-pamuk-images.json'dan inject edilir
import { readFileSync } from "node:fs";
import { join } from "node:path";
const IMAGES = JSON.parse(
  readFileSync(join(import.meta.dirname ?? __dirname, "seed-pamuk-images.json"), "utf8"),
) as Record<string, string>;

const PRODUCTS: ProductSeed[] = [
  // ─── TİŞÖRT (6) ───
  { sku: "TS-BEJ-001", slug: "pamuklu-basic-tisort-bej", name: "Pamuklu Basic Tişört — Bej",
    description: "Anadolu pamuğundan, sade kalıplı basic tişört. Bej tonu, her sezon kalıcı.",
    priceMinor: 29900, costMinor: 11900, category: "tisort", stock: 84,
    imageUrl: IMAGES["TS-BEJ-001"] },
  { sku: "TS-BLK-001", slug: "pamuklu-basic-tisort-siyah", name: "Pamuklu Basic Tişört — Siyah",
    description: "Aynı pamuk, aynı kalıp — siyah. Garderobun temeli.",
    priceMinor: 29900, costMinor: 11900, category: "tisort", stock: 102,
    imageUrl: IMAGES["TS-BLK-001"] },
  { sku: "TS-WHT-001", slug: "pamuklu-basic-tisort-beyaz", name: "Pamuklu Basic Tişört — Beyaz",
    description: "Saf beyaz, %100 pamuk. Çamaşır makinesinde 30°.",
    priceMinor: 29900, costMinor: 11900, category: "tisort", stock: 67,
    imageUrl: IMAGES["TS-WHT-001"] },
  { sku: "TS-OVE-002", slug: "oversize-v-yaka-tisort", name: "Oversize V Yaka Tişört",
    description: "Rahat kesim, V yaka. Krem rengiyle yumuşak bir günlük seçim.",
    priceMinor: 38900, costMinor: 15600, category: "tisort", stock: 32,
    imageUrl: IMAGES["TS-OVE-002"] },
  { sku: "TS-STR-003", slug: "cizgili-pamuk-tisort", name: "Çizgili Pamuk Tişört",
    description: "Lacivert-ekru breton çizgili, denizci klasik bir parça.",
    priceMinor: 34900, costMinor: 13800, category: "tisort", stock: 48,
    imageUrl: IMAGES["TS-STR-003"] },
  { sku: "TS-LTD-004", slug: "limited-anadolu-tisort", name: "Anadolu — Limited Baskı",
    description: "Adaçayı yeşili organik pamuk. Limitli koleksiyon, el işi nakış detay.",
    priceMinor: 44900, costMinor: 19000, category: "tisort", stock: 12,
    imageUrl: IMAGES["TS-LTD-004"] },

  // ─── GÖMLEK (5) ───
  { sku: "GM-LIN-001", slug: "keten-karisimi-gomlek-beyaz", name: "Keten Karışımı Gömlek — Beyaz",
    description: "%55 keten %45 pamuk. Yazlık dokuma, sedef düğme.",
    priceMinor: 59900, costMinor: 24500, category: "gomlek", stock: 38,
    imageUrl: IMAGES["GM-LIN-001"] },
  { sku: "GM-LIN-002", slug: "keten-karisimi-gomlek-bej", name: "Keten Karışımı Gömlek — Bej",
    description: "Bej tonu, ahşap düğmeli. Hafif, yumuşak.",
    priceMinor: 59900, costMinor: 24500, category: "gomlek", stock: 41,
    imageUrl: IMAGES["GM-LIN-002"] },
  { sku: "GM-OXF-003", slug: "oxford-pamuk-gomlek", name: "Oxford Pamuk Gömlek",
    description: "Açık mavi, klasik Oxford dokuma. Düğmeli yaka.",
    priceMinor: 54900, costMinor: 21800, category: "gomlek", stock: 26,
    imageUrl: IMAGES["GM-OXF-003"] },
  { sku: "GM-SLM-004", slug: "slim-kesim-gomlek-antrasit", name: "Slim Kesim Gömlek — Antrasit",
    description: "Sade ofis gömleği. Antrasit, dar kalıp.",
    priceMinor: 52900, costMinor: 20100, category: "gomlek", stock: 19,
    imageUrl: IMAGES["GM-SLM-004"] },
  { sku: "GM-DNM-005", slug: "denim-gomlek", name: "Denim Gömlek",
    description: "Indigo denim, cepleri ikili. Yumuşatılmış kumaş.",
    priceMinor: 68900, costMinor: 27500, category: "gomlek", stock: 28,
    imageUrl: IMAGES["GM-DNM-005"] },

  // ─── SWEAT & KAZAK (5) ───
  { sku: "SW-HOO-001", slug: "kapusonlu-sweatshirt", name: "Kapüşonlu Sweatshirt",
    description: "Krem rengi, ağır gramaj pamuk. Sıcak iç astar.",
    priceMinor: 79900, costMinor: 32400, category: "sweat-kazak", stock: 22,
    imageUrl: IMAGES["SW-HOO-001"] },
  { sku: "SW-CRW-002", slug: "crewneck-sweatshirt-gri", name: "Crewneck Sweatshirt — Gri",
    description: "Antrasit gri, klasik kesim. Yumuşak iç tüy.",
    priceMinor: 64900, costMinor: 26500, category: "sweat-kazak", stock: 34,
    imageUrl: IMAGES["SW-CRW-002"] },
  { sku: "SW-TRK-003", slug: "triko-kazak-deve-tuyu", name: "Triko Kazak — Deve Tüyü",
    description: "Kalın örgü, sıcak ve dayanıklı. Deve tüyü rengi.",
    priceMinor: 54900, costMinor: 22300, category: "sweat-kazak", stock: 17,
    imageUrl: IMAGES["SW-TRK-003"] },
  { sku: "SW-CRD-004", slug: "yun-karisimi-hirka", name: "Yün Karışımı Hırka",
    description: "Yulafa rengi, ahşap düğmeli. %35 yün karışım.",
    priceMinor: 89900, costMinor: 36800, category: "sweat-kazak", stock: 9,
    imageUrl: IMAGES["SW-CRD-004"] },
  { sku: "SW-POL-005", slug: "polar-yaka-merino-kazak", name: "Merino Polar Yaka Kazak",
    description: "Orman yeşili, ince örgü merinos yün. Soğuk günlere.",
    priceMinor: 69900, costMinor: 28900, category: "sweat-kazak", stock: 14,
    imageUrl: IMAGES["SW-POL-005"] },

  // ─── PANTOLON (5) ───
  { sku: "PN-CHN-001", slug: "chino-pantolon-bej", name: "Chino Pantolon — Bej",
    description: "Sade, dik dokulu pamuk twill. Düz kesim.",
    priceMinor: 54900, costMinor: 22800, category: "pantolon", stock: 46,
    imageUrl: IMAGES["PN-CHN-001"] },
  { sku: "PN-CHN-002", slug: "chino-pantolon-lacivert", name: "Chino Pantolon — Lacivert",
    description: "Lacivert ton, ofis ve günlük geçişli.",
    priceMinor: 54900, costMinor: 22800, category: "pantolon", stock: 39,
    imageUrl: IMAGES["PN-CHN-002"] },
  { sku: "PN-JGR-003", slug: "jogger-pantolon-antrasit", name: "Jogger Pantolon — Antrasit",
    description: "Yumuşak antrasit, lastikli paça. Rahat ev/sokak.",
    priceMinor: 49900, costMinor: 19800, category: "pantolon", stock: 53,
    imageUrl: IMAGES["PN-JGR-003"] },
  { sku: "PN-KLS-004", slug: "klasik-kumas-pantolon-siyah", name: "Klasik Kumaş Pantolon — Siyah",
    description: "Siyah, yün karışımı. Ütülü pile.",
    priceMinor: 64900, costMinor: 27200, category: "pantolon", stock: 18,
    imageUrl: IMAGES["PN-KLS-004"] },
  { sku: "PN-ESF-005", slug: "esofman-alti-gri", name: "Eşofman Altı — Gri",
    description: "Açık gri, ağır pamuk. Klasik eşofman kesim.",
    priceMinor: 44900, costMinor: 17900, category: "pantolon", stock: 61,
    imageUrl: IMAGES["PN-ESF-005"] },

  // ─── ELBİSE (4) ───
  { sku: "EL-LIN-001", slug: "keten-maxi-elbise-bej", name: "Keten Maxi Elbise — Bej",
    description: "Doğal kumtaşı bej, minimal kesim. Yazın klasiği.",
    priceMinor: 89900, costMinor: 36900, category: "elbise", stock: 24,
    imageUrl: IMAGES["EL-LIN-001"] },
  { sku: "EL-MIN-002", slug: "pamuk-mini-elbise-beyaz", name: "Pamuk Mini Elbise — Beyaz",
    description: "Saf beyaz, balon omuzlu. Pamuklu ve serin.",
    priceMinor: 54900, costMinor: 22100, category: "elbise", stock: 28,
    imageUrl: IMAGES["EL-MIN-002"] },
  { sku: "EL-SFN-003", slug: "sifon-yazlik-elbise-yesil", name: "Şifon Yazlık Elbise — Adaçayı",
    description: "Hafif şifon, salınan etek. Adaçayı yeşili.",
    priceMinor: 74900, costMinor: 30500, category: "elbise", stock: 16,
    imageUrl: IMAGES["EL-SFN-003"] },
  { sku: "EL-TRK-004", slug: "triko-elbise-deve-tuyu", name: "Triko Elbise — Deve Tüyü",
    description: "Fitilli triko, kışlık. Deve tüyü tonu.",
    priceMinor: 69900, costMinor: 28400, category: "elbise", stock: 13,
    imageUrl: IMAGES["EL-TRK-004"] },

  // ─── ETEK (3) ───
  { sku: "ET-MID-001", slug: "midi-etek-siyah", name: "Midi Etek — Siyah",
    description: "Yün karışım, kalem kesim. Diz altı boy.",
    priceMinor: 49900, costMinor: 19900, category: "etek", stock: 21,
    imageUrl: IMAGES["ET-MID-001"] },
  { sku: "ET-PLS-002", slug: "plise-etek-pudra", name: "Plise Etek — Pudra",
    description: "İnce plise, pudra pembe. Hafif ve hareketli.",
    priceMinor: 57900, costMinor: 23400, category: "etek", stock: 18,
    imageUrl: IMAGES["ET-PLS-002"] },
  { sku: "ET-DNM-003", slug: "mini-denim-etek", name: "Mini Denim Etek",
    description: "Açık yıkamalı denim, ham etek bitişi.",
    priceMinor: 54900, costMinor: 22000, category: "etek", stock: 26,
    imageUrl: IMAGES["ET-DNM-003"] },

  // ─── AKSESUAR (5) ───
  { sku: "AK-SHK-001", slug: "pamuk-bucket-sapka", name: "Pamuk Bucket Şapka",
    description: "Bej, dikiş kenarlı bucket şapka.",
    priceMinor: 24900, costMinor: 9200, category: "aksesuar", stock: 67,
    imageUrl: IMAGES["AK-SHK-001"] },
  { sku: "AK-ATK-002", slug: "yun-atki-deve-tuyu", name: "Yün Atkı — Deve Tüyü",
    description: "Saçaklı, yün karışım atkı.",
    priceMinor: 29900, costMinor: 11400, category: "aksesuar", stock: 41,
    imageUrl: IMAGES["AK-ATK-002"] },
  { sku: "AK-KMR-003", slug: "el-yapimi-deri-kemer-taba", name: "El Yapımı Deri Kemer — Taba",
    description: "Hakiki deri, pirinç toka. Taba ton.",
    priceMinor: 38900, costMinor: 14700, category: "aksesuar", stock: 33,
    imageUrl: IMAGES["AK-KMR-003"] },
  { sku: "AK-ELD-004", slug: "deri-eldiven-kasmir-astar", name: "Deri Eldiven — Kaşmir Astar",
    description: "Kahve deri, içi kaşmir astarlı eldiven.",
    priceMinor: 24900, costMinor: 9800, category: "aksesuar", stock: 29,
    imageUrl: IMAGES["AK-ELD-004"] },
  { sku: "AK-BER-005", slug: "ortuk-orgu-bere", name: "Örgü Bere — Ekru",
    description: "Ekru, kalın saç örgülü bere.",
    priceMinor: 19900, costMinor: 7600, category: "aksesuar", stock: 56,
    imageUrl: IMAGES["AK-BER-005"] },

  // ─── ÇANTA (3) ───
  { sku: "CN-TOT-001", slug: "tuval-tote-canta", name: "Tuval Tote Çanta",
    description: "Doğal tuval, kahve deri sap. Günlük taşımalık.",
    priceMinor: 49900, costMinor: 19400, category: "canta", stock: 38,
    imageUrl: IMAGES["CN-TOT-001"] },
  { sku: "CN-DRI-002", slug: "deri-mini-canta-taba", name: "Deri Mini Çanta — Taba",
    description: "Taba renk hakiki deri, pirinç metaller.",
    priceMinor: 89900, costMinor: 36700, category: "canta", stock: 12,
    imageUrl: IMAGES["CN-DRI-002"] },
  { sku: "CN-SRT-003", slug: "sirt-cantasi-yesil", name: "Sırt Çantası — Zeytin Yeşili",
    description: "Zeytin yeşili tuval, kahve deri detaylı sırt çantası.",
    priceMinor: 74900, costMinor: 30100, category: "canta", stock: 19,
    imageUrl: IMAGES["CN-SRT-003"] },

  // ─── YENİ SEZON (4) ───
  { sku: "TS-NEW-007", slug: "bahar-koleksiyon-tisort", name: "Bahar Koleksiyon Tişört",
    description: "Yeni sezon — pudra organik pamuk tişört.",
    priceMinor: 34900, costMinor: 14000, category: "tisort", stock: 44,
    imageUrl: IMAGES["TS-NEW-007"] },
  { sku: "EL-NEW-008", slug: "yeni-sezon-maxi-elbise", name: "Yeni Sezon Maxi Elbise",
    description: "Fildişi keten karışım, kruvaze maxi elbise.",
    priceMinor: 99900, costMinor: 40700, category: "elbise", stock: 8,
    imageUrl: IMAGES["EL-NEW-008"] },
  { sku: "SW-NEW-009", slug: "yeni-sezon-sweatshirt-yesil", name: "Yeni Sezon Sweatshirt — Yeşil",
    description: "Soft adaçayı, oversize kesim sweatshirt.",
    priceMinor: 74900, costMinor: 30500, category: "sweat-kazak", stock: 31,
    imageUrl: IMAGES["SW-NEW-009"] },
  { sku: "PN-NEW-010", slug: "yuksek-bel-bol-paca-pantolon", name: "Yüksek Bel Bol Paça Pantolon",
    description: "Ekru, yüksek bel, bol paça. Yeni siluet.",
    priceMinor: 59900, costMinor: 24100, category: "pantolon", stock: 22,
    imageUrl: IMAGES["PN-NEW-010"] },
];

// ───────────────────────── Customer pool ─────────────────────────

const FIRST_NAMES = [
  "Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Burcu", "Esra", "Deniz", "Pınar",
  "İrem", "Ceren", "Gizem", "Aslı", "Damla", "Tuğçe", "Gamze", "Şeyma", "Buse", "Sıla",
  "Mehmet", "Ahmet", "Ali", "Mustafa", "Hüseyin", "Hasan", "Emre", "Burak", "Onur", "Cem",
  "Caner", "Eren", "Furkan", "Kerem", "Berk", "Tolga", "Volkan", "Yiğit", "Murat", "Serhat",
  "Defne", "Naz", "Ece", "Beste", "Ela", "Yağmur", "Lara", "Mira", "Sena", "Nehir",
  "Kaan", "Doruk", "Atlas", "Ege", "Arda", "Mert", "Berkay", "Ozan", "Bora", "Sarp",
];
const LAST_NAMES = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
  "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Polat", "Korkmaz", "Erdoğan", "Avcı", "Tekin",
  "Güneş", "Aktaş", "Bulut", "Akın", "Acar", "Türk", "Şimşek", "Karaca", "Toprak", "Erdem",
];

const CITIES = [
  { city: "İstanbul", district: "Beşiktaş", postalCode: "34330" },
  { city: "İstanbul", district: "Kadıköy", postalCode: "34710" },
  { city: "İstanbul", district: "Şişli", postalCode: "34360" },
  { city: "Ankara", district: "Çankaya", postalCode: "06420" },
  { city: "İzmir", district: "Konak", postalCode: "35250" },
  { city: "İzmir", district: "Karşıyaka", postalCode: "35600" },
  { city: "Bursa", district: "Nilüfer", postalCode: "16110" },
  { city: "Antalya", district: "Muratpaşa", postalCode: "07100" },
  { city: "Eskişehir", district: "Tepebaşı", postalCode: "26110" },
  { city: "Konya", district: "Selçuklu", postalCode: "42050" },
];

const STREETS = [
  "Cumhuriyet Cad.", "Atatürk Bulv.", "Bağdat Cad.", "İstiklal Cad.", "Barbaros Bulv.",
  "Vatan Cad.", "Halaskargazi Cad.", "Şehit Adem Yavuz Sok.", "Lavanta Sok.", "Defne Sok.",
];

const AI_SEGMENTS = ["yeni", "sadık", "VIP", "risky", "kayıp", "potansiyel"];

const CUSTOMER_NOTES = [
  "Bahar koleksiyonu için ön sipariş bekliyor.",
  "İade adresi farklı, ofise gelsin.",
  "İnstagram'dan reklam üzerinden geldi.",
  "Düğün hediyesi siparişi.",
  "VIP — kişisel paketleme istiyor.",
  "Müşteri hizmetleriyle iletişimde sorun yok.",
  "İlk siparişinde memnun, geri döneceğini söyledi.",
];

const REVIEW_TEXTS = [
  "Kumaşı gerçekten kaliteli, tam beklediğim gibi.",
  "Bedeni biraz büyük geldi ama beğendim.",
  "Kargo hızlıydı, paketleme şık.",
  "Renk fotoğrafıyla birebir uyuyor.",
  "Tek beden farkla aldım, vücuduma iyi oturdu.",
  "Pamuğu ince ama yumuşak, yazın iyi gider.",
  "Yıkadıktan sonra çok az çekti, beklediğim gibi.",
  "Dikiş işçiliği çok temiz, fiyatına değer.",
  "Renk açıklamadan biraz daha soluk geldi.",
  "Aldığım siyahı çok beğendim, bej olanını da sipariş ettim.",
  "İkinci kez alıyorum, kaliteyi koruyor.",
  "Modeli rahat, günlük giyime uygun.",
];

// ───────────────────────── Wipe ─────────────────────────

async function wipe() {
  console.log("[wipe] başlıyor…");
  // Cart / wishlist
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.wishlist.deleteMany();
  // Bank + payment + invoice + refund
  await db.bankTransaction.deleteMany();
  await db.payment.deleteMany();
  await db.invoice.deleteMany();
  await db.refund.deleteMany();
  // Order items + orders
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  // Products
  await db.productReview.deleteMany();
  await db.inventoryAdjustment.deleteMany();
  await db.inventory.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  // Customers
  await db.customerEmail.deleteMany();
  await db.customerAddress.deleteMany();
  await db.dataDeletionRequest.deleteMany();
  await db.customer.deleteMany();
  // Operations
  await db.expense.deleteMany();
  await db.supplier.deleteMany().catch(() => {});
  await db.salesGoal.deleteMany().catch(() => {});
  await db.discount.deleteMany().catch(() => {});
  // activity log — KVKK ve AgentTask hariç
  await db.activityLog.deleteMany({
    where: { entityType: { notIn: ["AgentTask", "DataDeletionRequest", "SystemSettings"] } },
  }).catch(() => {});
  console.log("[wipe] tamam.");
}

// ───────────────────────── Seed phases ─────────────────────────

async function seedCategories() {
  console.log("[cat] 8 kategori…");
  const map = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await db.category.create({
      data: { slug: c.slug, name: c.name },
    });
    map.set(c.slug, created.id);
  }
  return map;
}

async function seedProducts(catMap: Map<string, string>) {
  console.log(`[prod] ${PRODUCTS.length} ürün…`);
  const created: Array<{ id: string; sku: string; priceMinor: number; stock: number; name: string }> = [];
  for (const p of PRODUCTS) {
    const product = await db.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.priceMinor,
        costPrice: p.costMinor,
        currency: "TRY",
        status: p.status ?? "PUBLISHED",
        images: [p.imageUrl],
        categoryId: catMap.get(p.category) ?? null,
      },
    });
    await db.inventory.create({
      data: { productId: product.id, quantity: p.stock },
    });
    created.push({ id: product.id, sku: p.sku, priceMinor: p.priceMinor, stock: p.stock, name: p.name });
  }
  return created;
}

async function seedCustomers() {
  console.log("[cust] 85 müşteri…");
  const created: Array<{ id: string; email: string; name: string; vip: boolean }> = [];
  // VIP customers — repeat buyers
  const vipCount = 12;
  for (let i = 0; i < 85; i++) {
    const fn = pick(FIRST_NAMES);
    const ln = pick(LAST_NAMES);
    const name = `${fn} ${ln}`;
    const emailLocal = `${fn.toLowerCase().replace(/[şıöçü ]/g, (c) => ({ş:"s",ı:"i",ö:"o",ç:"c",ü:"u"} as Record<string,string>)[c] ?? c)}.${ln.toLowerCase().replace(/[şıöçü ]/g, (c) => ({ş:"s",ı:"i",ö:"o",ç:"c",ü:"u"} as Record<string,string>)[c] ?? c)}${i}`;
    const email = `${emailLocal}@example.com`;
    const isVip = i < vipCount;
    const seg = isVip
      ? pick(["VIP", "sadık"])
      : pick(AI_SEGMENTS);
    const city = pick(CITIES);
    const address = {
      line1: `${pick(STREETS)} No: ${randInt(1, 220)}`,
      district: city.district,
      city: city.city,
      country: "Türkiye",
      postalCode: city.postalCode,
    };
    const c = await db.customer.create({
      data: {
        name,
        email,
        phone: `+90 5${randInt(30, 59)} ${String(randInt(100, 999))} ${String(randInt(10, 99)).padStart(2, "0")} ${String(randInt(10, 99)).padStart(2, "0")}`,
        address: address as never,
        notes: rand() < 0.25 ? pick(CUSTOMER_NOTES) : null,
        aiSegment: seg,
        aiSegmentConfidence: randInt(55, 95),
        aiSegmentUpdatedAt: daysAgo(randInt(1, 90)),
        createdAt: daysAgo(randInt(20, 150)),
      },
    });
    // Address record (separate table for multi-address support)
    await db.customerAddress.create({
      data: {
        customerId: c.id,
        label: "Ev",
        fullName: name,
        phone: c.phone ?? null,
        line1: address.line1,
        district: address.district,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode,
        isDefault: true,
      },
    });
    created.push({ id: c.id, email, name, vip: isVip });
  }
  return created;
}

async function seedOrders(
  customers: Array<{ id: string; email: string; name: string; vip: boolean }>,
  products: Array<{ id: string; sku: string; priceMinor: number; stock: number; name: string }>,
) {
  // 5 ay = 150 gün; büyüme eğrisi: ay başına 30→45→55→65→80 = ~275 sipariş, son 13 gün ~35 = ~310 sipariş
  const ordersPerMonth = [30, 45, 55, 65, 80];
  const TOTAL_DAYS = 150;
  const orderDays: number[] = [];
  for (let month = 0; month < 5; month++) {
    const count = ordersPerMonth[month];
    const startDay = (4 - month) * 30; // 150..120, 120..90, ...
    for (let i = 0; i < count; i++) {
      orderDays.push(startDay - randInt(0, 29));
    }
  }
  // Son 13 gün için ek 35
  for (let i = 0; i < 35; i++) {
    orderDays.push(randInt(0, 13));
  }
  orderDays.sort((a, b) => b - a); // büyükten küçüğe (eski → yeni)

  console.log(`[order] ${orderDays.length} sipariş yaratılıyor…`);
  const orders: Array<{ id: string; total: number; status: OrderStatus; createdAt: Date; customerId: string }> = [];
  let seq = 1;

  for (const dayAgo of orderDays) {
    // Müşteri seçimi: VIP'ler ~40% daha sık
    const useVip = rand() < 0.4;
    const pool = useVip ? customers.filter((c) => c.vip) : customers;
    const customer = pick(pool.length > 0 ? pool : customers);

    // 1-4 farklı ürün
    const itemCount = pick([1, 1, 1, 2, 2, 2, 3, 3, 4]);
    const items = pickN(products, itemCount);

    // Status dağılımı: eski siparişler daha çok DELIVERED, yenisi PENDING/SHIPPED
    let status: OrderStatus;
    if (dayAgo > 60) {
      status = pick([
        "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
        "DELIVERED", "DELIVERED", "REFUNDED", "CANCELLED",
      ]) as OrderStatus;
    } else if (dayAgo > 14) {
      status = pick([
        "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "REFUNDED",
      ]) as OrderStatus;
    } else if (dayAgo > 4) {
      status = pick([
        "DELIVERED", "SHIPPED", "SHIPPED", "CONFIRMED",
      ]) as OrderStatus;
    } else {
      status = pick(["PENDING", "PENDING", "CONFIRMED", "SHIPPED"]) as OrderStatus;
    }

    const createdAt = daysAgo(dayAgo, randInt(0, 23));
    let subtotal = 0;
    const itemData: { productId: string; name: string; unitPrice: number; quantity: number; total: number }[] = [];
    for (const p of items) {
      const qty = pick([1, 1, 1, 1, 2, 2, 3]);
      const lineTotal = p.priceMinor * qty;
      subtotal += lineTotal;
      itemData.push({
        productId: p.id,
        name: p.name,
        unitPrice: p.priceMinor,
        quantity: qty,
        total: lineTotal,
      });
    }
    const shipping = subtotal >= 50000 ? 0 : 3990; // 500 TL üstü kargo ücretsiz
    const tax = 0; // KDV dahil
    const total = subtotal + shipping + tax;
    const orderNumber = `PMK-${(seq++).toString().padStart(5, "0")}`;

    const cityInfo = pick(CITIES);
    const shippingAddress = {
      fullName: customer.name,
      phone: `+90 5${randInt(30, 59)} ${String(randInt(100, 999))} ${String(randInt(10, 99)).padStart(2, "0")} ${String(randInt(10, 99)).padStart(2, "0")}`,
      line1: `${pick(STREETS)} No: ${randInt(1, 220)}`,
      district: cityInfo.district,
      city: cityInfo.city,
      country: "Türkiye",
      postalCode: cityInfo.postalCode,
    };
    const carrier = pick(["ARAS", "YURTICI", "MNG", "PTT"]);
    const trackingNumber =
      status === "SHIPPED" || status === "DELIVERED"
        ? `${carrier.slice(0, 3)}-${randInt(100000000, 999999999)}`
        : null;
    const shippedAt =
      status === "SHIPPED" || status === "DELIVERED"
        ? daysAgo(Math.max(0, dayAgo - randInt(1, 2)), randInt(8, 20))
        : null;
    const deliveredAt =
      status === "DELIVERED"
        ? daysAgo(Math.max(0, dayAgo - randInt(2, 4)), randInt(8, 20))
        : null;

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
        shippingAddress: shippingAddress as never,
        billingAddress: shippingAddress as never,
        billingSameAsShipping: true,
        carrier,
        trackingNumber,
        shippedAt,
        deliveredAt,
        createdAt,
        updatedAt: createdAt,
        items: { create: itemData },
      },
    });
    orders.push({ id: order.id, total, status, createdAt, customerId: customer.id });
  }
  return orders;
}

async function seedInvoicesAndRefunds(orders: Array<{ id: string; total: number; status: OrderStatus; createdAt: Date }>) {
  console.log("[inv] fatura + iade…");
  const REFUND_REASONS = ["CUSTOMER_REQUEST", "DEFECTIVE", "WRONG_ITEM", "LATE_DELIVERY", "OTHER"] as const;
  let invSeq = 1;
  for (const o of orders) {
    if (["DELIVERED", "SHIPPED", "REFUNDED"].includes(o.status)) {
      const totalMinor = o.total;
      const taxMinor = Math.round(totalMinor - totalMinor / 1.2); // KDV %20
      const uuid = `${o.id.slice(-8)}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
        .toString(36)
        .slice(-6)}-${invSeq}`;
      await db.invoice
        .create({
          data: {
            orderId: o.id,
            invoiceNumber: `PMK-${o.createdAt.getFullYear()}-${(invSeq++)
              .toString()
              .padStart(6, "0")}`,
            status: "ACCEPTED" as never,
            documentType: "EARSIV",
            ublXml: "<Invoice><!-- seed-mock --></Invoice>",
            uuid,
            totalMinor,
            taxMinor,
            currency: "TRY",
            mode: "test",
            sentAt: new Date(o.createdAt.getTime() + 86_400_000),
            acceptedAt: new Date(o.createdAt.getTime() + 86_400_000),
          },
        })
        .catch(() => {});
    }
    if (o.status === "REFUNDED") {
      await db.refund
        .create({
          data: {
            orderId: o.id,
            amount: o.total,
            reason: pick([...REFUND_REASONS]) as never,
            status: "COMPLETED",
            createdAt: new Date(o.createdAt.getTime() + 6 * 86_400_000),
          },
        })
        .catch(() => {});
    }
  }
}

async function seedBankTransactions(orders: Array<{ id: string; total: number; status: OrderStatus; createdAt: Date; customerId: string }>) {
  console.log("[bank] havale hareketleri…");
  const customerMap = new Map<string, { name: string }>();
  for (const c of await db.customer.findMany({ select: { id: true, name: true } })) {
    customerMap.set(c.id, { name: c.name });
  }

  const banks = ["Garanti BBVA", "İş Bankası", "Yapı Kredi", "Akbank"];
  const ibanPrefixes = {
    "Garanti BBVA": "TR62 0006 2000 5040",
    "İş Bankası": "TR58 0006 4000 0011",
    "Yapı Kredi": "TR81 0006 7010 0000",
    "Akbank": "TR33 0004 6000 7888",
  } as Record<string, string>;

  // Sipariş ödemesi — DELIVERED/SHIPPED/REFUNDED içiın IN bank tx
  for (const o of orders) {
    if (["PENDING", "CANCELLED"].includes(o.status)) continue;
    const bank = pick(banks);
    const iban = `${ibanPrefixes[bank]} ${String(randInt(1000, 9999))} ${String(randInt(1000, 9999))} ${String(randInt(10, 99))}`;
    const customerName = customerMap.get(o.customerId)?.name ?? "Müşteri";
    const matched = rand() < 0.82; // %82 matched
    await db.bankTransaction.create({
      data: {
        bankName: bank,
        accountIban: iban,
        reference: `${bank.slice(0, 3).toUpperCase()}-${randInt(100000, 999999)}-${randInt(10, 99)}`,
        transactionDate: new Date(o.createdAt.getTime() + randInt(0, 12) * 3_600_000),
        amountMinor: o.total,
        currency: "TRY",
        description: `EFT ${customerName} - sipariş ödemesi`,
        direction: BankTransactionDirection.IN,
        source: pick(["WEBHOOK", "CSV", "MANUAL"]),
        status: matched
          ? rand() < 0.7
            ? BankTransactionStatus.AUTO_MATCHED
            : BankTransactionStatus.MANUAL_MATCHED
          : BankTransactionStatus.UNMATCHED,
        matchedOrderId: matched ? o.id : null,
        matchConfidence: matched ? randInt(70, 99) : null,
        matchedAt: matched ? new Date(o.createdAt.getTime() + 4 * 3_600_000) : null,
        matchedBy: matched ? (rand() < 0.7 ? "AI" : "USER:demo") : null,
      },
    });
  }

  // Çıkış hareketleri — tedarikçi, kira, maaş, vergi
  const OUT_DESCRIPTIONS = [
    { desc: "Anadolu Tekstil — pamuk hammadde", min: 12000_00, max: 45000_00 },
    { desc: "İstanbul Konfeksiyon — dikiş", min: 8000_00, max: 22000_00 },
    { desc: "Aras Kargo — Şubat dönemi", min: 3500_00, max: 7200_00 },
    { desc: "Yurtiçi Kargo — toplu fatura", min: 2800_00, max: 6500_00 },
    { desc: "Cam Atölye — kira", min: 18000_00, max: 18000_00 },
    { desc: "Elektrik — TEDAŞ", min: 1200_00, max: 2800_00 },
    { desc: "İnternet — Türk Telekom", min: 450_00, max: 650_00 },
    { desc: "Maaş ödemesi — Yıldız H.", min: 28000_00, max: 35000_00 },
    { desc: "Maaş ödemesi — Aslı T.", min: 25000_00, max: 31000_00 },
    { desc: "KDV ödemesi — GİB", min: 5400_00, max: 18000_00 },
  ];
  const monthsBack = 5;
  for (let month = 0; month < monthsBack; month++) {
    const dayBase = month * 30;
    for (const d of OUT_DESCRIPTIONS) {
      const amount = randInt(d.min, d.max);
      await db.bankTransaction.create({
        data: {
          bankName: pick(banks),
          accountIban: null,
          reference: `OUT-${randInt(100000, 999999)}`,
          transactionDate: daysAgo(dayBase + randInt(1, 25), randInt(0, 23)),
          amountMinor: -amount,
          currency: "TRY",
          description: d.desc,
          direction: BankTransactionDirection.OUT,
          source: "CSV",
          status: BankTransactionStatus.IGNORED,
          matchedOrderId: null,
        },
      });
    }
  }
}

async function seedReviews(
  orders: Array<{ id: string; status: OrderStatus; createdAt: Date; customerId: string }>,
) {
  console.log("[rev] ürün yorumları…");
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  // Her DELIVERED siparişin ~%55'i için yorum
  const itemsByOrder = await db.orderItem.findMany({
    where: { orderId: { in: delivered.map((o) => o.id) } },
    select: { orderId: true, productId: true },
  });
  const byOrder = new Map<string, { productId: string }[]>();
  for (const i of itemsByOrder) {
    const list = byOrder.get(i.orderId) ?? [];
    list.push({ productId: i.productId });
    byOrder.set(i.orderId, list);
  }

  for (const o of delivered) {
    if (rand() > 0.55) continue;
    const customer = await db.customer.findUnique({
      where: { id: o.customerId },
      select: { name: true, email: true },
    });
    if (!customer) continue;
    const orderItems = byOrder.get(o.id) ?? [];
    if (orderItems.length === 0) continue;
    const item = pick(orderItems);
    const rating = pick([3, 4, 4, 4, 5, 5, 5, 5, 5]);
    await db.productReview.create({
      data: {
        productId: item.productId,
        authorName: customer.name,
        authorEmail: customer.email,
        rating,
        body: pick(REVIEW_TEXTS),
        isPublished: rand() < 0.9,
        createdAt: new Date(o.createdAt.getTime() + randInt(4, 18) * 86_400_000),
      },
    }).catch(() => {});
  }
}

async function seedSuppliersExpenses() {
  console.log("[ops] tedarikçi + gider…");
  const suppliers = [
    {
      name: "Anadolu Tekstil",
      email: "iletisim@anadolutekstil.com.tr",
      contactPerson: "Hakan Yıldız",
      productSkus: ["TS-BEJ-001", "TS-BLK-001", "TS-WHT-001", "TS-OVE-002", "TS-STR-003", "TS-LTD-004"],
      leadTimeDays: 14,
    },
    {
      name: "Bursa Konfeksiyon",
      email: "siparis@bursakonfek.com.tr",
      contactPerson: "Aslı Tunç",
      productSkus: ["GM-LIN-001", "GM-LIN-002", "GM-OXF-003", "GM-SLM-004", "GM-DNM-005"],
      leadTimeDays: 21,
    },
    {
      name: "Denizli Triko",
      email: "info@denizlitrik.com",
      contactPerson: "Murat Erdem",
      productSkus: ["SW-HOO-001", "SW-CRW-002", "SW-TRK-003", "SW-CRD-004", "SW-POL-005"],
      leadTimeDays: 18,
    },
    {
      name: "İzmir Deri",
      email: "satin@izmirderi.com.tr",
      contactPerson: "Ece Polat",
      productSkus: ["AK-KMR-003", "AK-ELD-004", "CN-DRI-002"],
      leadTimeDays: 30,
    },
  ];
  for (const s of suppliers) {
    await db.supplier.create({
      data: { ...s, isActive: true },
    }).catch(() => {});
  }

  // 5 ay aylık birkaç gider kaydı
  const expenseCats = [
    { cat: "RENT", desc: "Atölye kirası — Kadıköy", amount: 1800000 },
    { cat: "UTILITIES", desc: "Elektrik faturası", amount: 220000 },
    { cat: "UTILITIES", desc: "İnternet + telefon", amount: 75000 },
    { cat: "COGS", desc: "Pamuk hammadde — Anadolu Tekstil", amount: 3200000 },
    { cat: "MARKETING", desc: "Instagram reklam bütçesi", amount: 480000 },
    { cat: "SHIPPING", desc: "Kargo anlaşma — Aras", amount: 350000 },
    { cat: "PAYROLL", desc: "Personel maaş ödemesi", amount: 8500000 },
    { cat: "TAXES", desc: "KDV beyannamesi", amount: 1240000 },
  ];
  for (let month = 0; month < 5; month++) {
    for (const e of expenseCats) {
      const variance = (rand() - 0.5) * 0.3; // ±15%
      await db.expense.create({
        data: {
          date: daysAgo(month * 30 + randInt(1, 25)),
          amount: Math.round(e.amount * (1 + variance)),
          currency: "TRY",
          category: e.cat as never,
          description: e.desc,
        },
      }).catch(() => {});
    }
  }
}

// ───────────────────────── Main ─────────────────────────

async function main() {
  if (process.env.SEED_FORCE !== "1") {
    console.error("Refusing to run. Set SEED_FORCE=1 to confirm.");
    process.exit(1);
  }

  await wipe();
  const catMap = await seedCategories();
  const products = await seedProducts(catMap);
  const customers = await seedCustomers();
  const orders = await seedOrders(customers, products);
  await seedInvoicesAndRefunds(orders);
  await seedBankTransactions(orders);
  await seedReviews(orders);
  await seedSuppliersExpenses();

  console.log("\n✅ Production seed tamam.");
  console.log(`   ${products.length} ürün`);
  console.log(`   ${customers.length} müşteri`);
  console.log(`   ${orders.length} sipariş`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
