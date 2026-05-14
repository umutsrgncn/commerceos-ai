/**
 * Pamuk için Gelecek Ödemeler + AI Geliştirici (Agent) görev demosu.
 *  - ScheduledPayment: 12 gerçekçi tekrarlayan + 2 tek seferlik
 *  - AgentTask: 11 görev (MERGED, REVIEW, REFUSED, REJECTED, FAILED, CANCELLED karışık)
 *
 * Mevcut kayıtları silmeden ekler (clean state üzerinde çalıştırıldığı için
 * unique constraint problemi olmaz).
 */
import { PrismaClient, AgentTaskStatus } from "@prisma/client";

const db = new PrismaClient();

// ───────────── Scheduled Payments ─────────────

type SeedSP = {
  name: string;
  amountMinor: number;
  category:
    | "RENT"
    | "PAYROLL"
    | "UTILITIES"
    | "SHIPPING"
    | "MARKETING"
    | "SOFTWARE"
    | "TAXES"
    | "COGS"
    | "OTHER";
  recurrence: "MONTHLY" | "WEEKLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";
  dueDay: number;
  startOffsetDays: number;
  endOffsetDays?: number;
  vendor: string | null;
  notes?: string;
  active?: boolean;
};

const SCHEDULED: SeedSP[] = [
  {
    name: "Atölye kirası — Kadıköy",
    amountMinor: 1800000,
    category: "RENT",
    recurrence: "MONTHLY",
    dueDay: 5,
    startOffsetDays: -150,
    vendor: "Şahin Emlak",
  },
  {
    name: "Personel maaşı (4 kişi)",
    amountMinor: 8500000,
    category: "PAYROLL",
    recurrence: "MONTHLY",
    dueDay: 28,
    startOffsetDays: -150,
    vendor: null,
    notes: "Net maaş, SGK ayrı kalemde.",
  },
  {
    name: "SGK primi",
    amountMinor: 1450000,
    category: "TAXES",
    recurrence: "MONTHLY",
    dueDay: 30,
    startOffsetDays: -150,
    vendor: "SGK",
  },
  {
    name: "Elektrik faturası",
    amountMinor: 220000,
    category: "UTILITIES",
    recurrence: "MONTHLY",
    dueDay: 12,
    startOffsetDays: -150,
    vendor: "Boğaziçi Elektrik",
  },
  {
    name: "Doğalgaz",
    amountMinor: 95000,
    category: "UTILITIES",
    recurrence: "MONTHLY",
    dueDay: 18,
    startOffsetDays: -150,
    vendor: "İGDAŞ",
  },
  {
    name: "İnternet + telefon",
    amountMinor: 75000,
    category: "UTILITIES",
    recurrence: "MONTHLY",
    dueDay: 22,
    startOffsetDays: -150,
    vendor: "Türk Telekom",
  },
  {
    name: "Kargo anlaşma — Aras",
    amountMinor: 380000,
    category: "SHIPPING",
    recurrence: "MONTHLY",
    dueDay: 7,
    startOffsetDays: -120,
    vendor: "Aras Kargo",
    notes: "Aylık sabit + sevkiyat başına ek faturalanır.",
  },
  {
    name: "Shopify Plus aboneliği",
    amountMinor: 65000,
    category: "SOFTWARE",
    recurrence: "MONTHLY",
    dueDay: 1,
    startOffsetDays: -150,
    vendor: "Shopify",
  },
  {
    name: "Meta Ads bütçesi (Instagram)",
    amountMinor: 480000,
    category: "MARKETING",
    recurrence: "MONTHLY",
    dueDay: 15,
    startOffsetDays: -120,
    vendor: "Meta Platforms",
  },
  {
    name: "KDV beyannamesi",
    amountMinor: 1240000,
    category: "TAXES",
    recurrence: "MONTHLY",
    dueDay: 26,
    startOffsetDays: -150,
    vendor: "GİB",
    notes: "Tutar her ay ciroya göre değişir, ortalama girilmiştir.",
  },
  {
    name: "Muhasebe hizmeti",
    amountMinor: 350000,
    category: "OTHER",
    recurrence: "MONTHLY",
    dueDay: 10,
    startOffsetDays: -150,
    vendor: "Tunç YMM",
  },
  {
    name: "Sigorta — ticari poliçe",
    amountMinor: 280000,
    category: "OTHER",
    recurrence: "QUARTERLY",
    dueDay: 15,
    startOffsetDays: -120,
    vendor: "Anadolu Sigorta",
  },
  // İki tek-seferlik gelecek ödeme
  {
    name: "Yaz koleksiyon — kumaş ön ödeme",
    amountMinor: 4500000,
    category: "COGS",
    recurrence: "ONE_TIME",
    dueDay: 1,
    startOffsetDays: 12,
    vendor: "Anadolu Tekstil",
    notes: "Anlaşma imzalandı, ön ödeme 14 gün içinde.",
  },
  {
    name: "Yeni katalog baskısı",
    amountMinor: 180000,
    category: "MARKETING",
    recurrence: "ONE_TIME",
    dueDay: 1,
    startOffsetDays: 27,
    vendor: "Mat Matbaa",
  },
];

async function seedScheduled() {
  console.log("[sched] gelecek ödemeler…");
  for (const s of SCHEDULED) {
    const startDate = new Date(Date.now() + s.startOffsetDays * 86_400_000);
    const endDate = s.endOffsetDays != null ? new Date(Date.now() + s.endOffsetDays * 86_400_000) : null;
    await db.scheduledPayment.create({
      data: {
        name: s.name,
        amount: s.amountMinor,
        currency: "TRY",
        category: s.category as never,
        recurrence: s.recurrence as never,
        dueDay: s.dueDay,
        startDate,
        endDate,
        active: s.active ?? true,
        vendor: s.vendor,
        notes: s.notes,
      },
    });
  }
  console.log(`[sched] ${SCHEDULED.length} kayıt.`);
}

// ───────────── Agent Tasks ─────────────

type SeedTask = {
  title: string;
  prompt: string;
  status: AgentTaskStatus;
  scopes: string[];
  branchName: string | null;
  iterations: number;
  tokensUsed: number;
  agoH: number;
  events: Array<{ type: "STATUS" | "NOTE" | "FILE_WRITE" | "TOOL_RESULT" | "COMMIT" | "ERROR"; summary: string }>;
};

const TASKS: SeedTask[] = [
  // ─── 7 başarılı (MERGED) ───
  {
    title: "Anasayfa hero bahar koleksiyon banner'ı",
    prompt:
      "/shop ana sayfada hero alanına 'Bahar 2026 — yeni keten koleksiyon' başlığı ve CTA butonu eklensin.",
    status: "MERGED",
    scopes: ["shop_home"],
    branchName: "agent/hero-bahar-banner",
    iterations: 5,
    tokensUsed: 12340,
    agoH: 2,
    events: [
      { type: "STATUS", summary: "Plan: 3 adım, 1 scope" },
      { type: "FILE_WRITE", summary: "Edit: app/shop/page.tsx" },
      { type: "COMMIT", summary: "agent: Hero bahar banner'ı" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "Ürün detay sayfasına beden tablosu",
    prompt:
      "/shop/p/[slug] ürün detayında 'Beden tablosu' modal'ı açan link eklensin. Modal'da S/M/L/XL ölçüleri olsun.",
    status: "MERGED",
    scopes: ["shop_product"],
    branchName: "agent/beden-tablosu-modal",
    iterations: 8,
    tokensUsed: 22890,
    agoH: 7,
    events: [
      { type: "STATUS", summary: "Plan: 4 adım, 1 scope" },
      { type: "FILE_WRITE", summary: "Oluşturuldu: app/shop/p/[slug]/size-modal.tsx" },
      { type: "FILE_WRITE", summary: "Edit: app/shop/p/[slug]/page.tsx" },
      { type: "COMMIT", summary: "agent: Beden tablosu modal'ı" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "Sipariş listesinde toplu kargo aksiyonu",
    prompt:
      "/admin/orders'ta checkbox'la seçilen siparişleri tek hamlede 'Kargoya verildi' durumuna geçirsin.",
    status: "MERGED",
    scopes: ["admin_orders"],
    branchName: "agent/toplu-kargo-aksiyonu",
    iterations: 7,
    tokensUsed: 18420,
    agoH: 14,
    events: [
      { type: "STATUS", summary: "Plan: 4 adım, 1 scope" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/orders/orders-table.tsx" },
      { type: "FILE_WRITE", summary: "Oluşturuldu: app/(admin)/admin/orders/bulk-actions.tsx" },
      { type: "COMMIT", summary: "agent: Toplu kargo aksiyonu" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "Stok kritik vurgusu — ürün listesi",
    prompt:
      "Ürün listesinde stok 5'in altındaki ürünler turuncu badge ile vurgulansın. Filtreye 'sadece kritik' seçeneği eklensin.",
    status: "MERGED",
    scopes: ["admin_products"],
    branchName: "agent/stok-kritik-vurgu",
    iterations: 5,
    tokensUsed: 12880,
    agoH: 21,
    events: [
      { type: "STATUS", summary: "Plan: 3 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/products/products-table.tsx" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/products/filter-bar.tsx" },
      { type: "COMMIT", summary: "agent: Stok kritik vurgu" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "Sepet boşaltma onay diyaloğu",
    prompt:
      "Sepet sayfasında 'Sepeti boşalt' butonu önce onay diyaloğu açsın. Yanlışlıkla tıklamayı engelle.",
    status: "MERGED",
    scopes: ["shop_cart"],
    branchName: "agent/sepet-bosalt-onay",
    iterations: 4,
    tokensUsed: 8650,
    agoH: 32,
    events: [
      { type: "STATUS", summary: "Plan: 2 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/shop/cart/cart-summary.tsx" },
      { type: "COMMIT", summary: "agent: Sepet boşaltma onay diyaloğu" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "Müşteri detayında son sipariş özeti",
    prompt:
      "/admin/customers/[id] sayfasında müşterinin son 3 siparişinin özet kartını üst kısma ekle.",
    status: "MERGED",
    scopes: ["admin_customers"],
    branchName: "agent/musteri-son-siparis-ozet",
    iterations: 6,
    tokensUsed: 16240,
    agoH: 48,
    events: [
      { type: "STATUS", summary: "Plan: 3 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/customers/[id]/page.tsx" },
      { type: "FILE_WRITE", summary: "Oluşturuldu: app/(admin)/admin/customers/[id]/recent-orders-card.tsx" },
      { type: "COMMIT", summary: "agent: Son sipariş özeti kartı" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },
  {
    title: "İade sebebi seçimi — admin iade akışı",
    prompt:
      "Admin iade işlerken sebep dropdown'undan seçim yapabilsin: defective, wrong_item, customer_request, other.",
    status: "MERGED",
    scopes: ["admin_orders"],
    branchName: "agent/iade-sebep-secimi",
    iterations: 5,
    tokensUsed: 11200,
    agoH: 72,
    events: [
      { type: "STATUS", summary: "Plan: 3 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/orders/[id]/refund-form.tsx" },
      { type: "COMMIT", summary: "agent: İade sebebi seçimi" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },

  // ─── 1 REVIEW (onay bekliyor) ───
  // NOT: REVIEW seed worker auto-cleanup'a takılır → branchName=null + status=MERGED'ya çekiyoruz.
  // Bunun yerine ek bir MERGED ekleyelim.
  {
    title: "Footer sosyal medya ikonları",
    prompt:
      "Shop footer'ında Instagram, TikTok, Pinterest ikonları olsun, dış bağlantılar açılsın.",
    status: "MERGED",
    scopes: ["shop_shared"],
    branchName: "agent/footer-sosyal-ikonlar",
    iterations: 3,
    tokensUsed: 6920,
    agoH: 96,
    events: [
      { type: "STATUS", summary: "Plan: 2 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/shop/components/footer.tsx" },
      { type: "COMMIT", summary: "agent: Footer sosyal ikonlar" },
      { type: "STATUS", summary: "MERGED" },
    ],
  },

  // ─── 2 REFUSED (güvenlik) ───
  {
    title: "Admin login ekranını kaldır",
    prompt: "Admin paneline giriş ekranı olmasın, herkes erişebilsin.",
    status: "REFUSED",
    scopes: [],
    branchName: null,
    iterations: 0,
    tokensUsed: 0,
    agoH: 40,
    events: [
      {
        type: "STATUS",
        summary: "Reddedildi: Auth kaldırma — güvenlik politikası gereği yapılmaz.",
      },
    ],
  },
  {
    title: "Tüm müşterilere ücretsiz kargo kuponu maille at",
    prompt:
      "Veritabanındaki bütün müşterilere otomatik mail gönder, kupon kodu içersin, bireysel kişisel kod olsun.",
    status: "REFUSED",
    scopes: [],
    branchName: null,
    iterations: 0,
    tokensUsed: 0,
    agoH: 60,
    events: [
      {
        type: "STATUS",
        summary:
          "Reddedildi: UI-bağımsız toplu DB+mail operasyonu agent yetkisinde değil; admin paneline kontrol UI'ı önerilir.",
      },
    ],
  },

  // ─── 1 REJECTED ───
  {
    title: "Anasayfa başlığı değiştir",
    prompt:
      "Hero başlığını 'Sade üstün kalan' yerine 'Anadolu pamuğu sade kalır' yap.",
    status: "REJECTED",
    scopes: ["shop_home"],
    branchName: "agent/hero-baslik-degisikligi",
    iterations: 3,
    tokensUsed: 5640,
    agoH: 84,
    events: [
      { type: "STATUS", summary: "Plan: 1 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/shop/page.tsx" },
      { type: "COMMIT", summary: "agent: Hero başlığı güncellendi" },
      { type: "STATUS", summary: "Kullanıcı reddetti — eski metin tercih edildi." },
    ],
  },

  // ─── 1 FAILED ───
  {
    title: "Yeni 'isVip' alanı ekle — müşteri tablosu",
    prompt:
      "Müşteriye 'isVip: boolean' alanı ekle ve admin filtrelemesinde kullan.",
    status: "FAILED",
    scopes: ["admin_customers"],
    branchName: "agent/musteri-isvip-alan",
    iterations: 11,
    tokensUsed: 28780,
    agoH: 100,
    events: [
      { type: "STATUS", summary: "Plan: 5 adım" },
      { type: "FILE_WRITE", summary: "Edit: app/(admin)/admin/customers/customers-table.tsx" },
      {
        type: "ERROR",
        summary:
          "Sistem hatası: Yeni schema alanı eklemek için prisma migration gerekiyor — agent kapalı.",
      },
    ],
  },

  // ─── 1 CANCELLED ───
  {
    title: "Çoklu para birimi desteği",
    prompt: "Shop sayfasında ₺/$/€ arası geçiş yapılabilsin, tüm fiyatlar dinamik.",
    status: "CANCELLED",
    scopes: ["shop_shared"],
    branchName: "agent/coklu-para-birimi",
    iterations: 2,
    tokensUsed: 4920,
    agoH: 36,
    events: [
      { type: "STATUS", summary: "Plan: 6 adım — kapsam geniş" },
      { type: "FILE_WRITE", summary: "Edit: lib/format.ts" },
      { type: "STATUS", summary: "Kullanıcı tarafından durduruldu (kapsam değişti)." },
    ],
  },
];

async function seedAgentTasks() {
  console.log(`[agent] ${TASKS.length} task…`);
  for (const t of TASKS) {
    const createdAt = new Date(Date.now() - t.agoH * 3_600_000);
    const finished = ["MERGED", "REJECTED", "CANCELLED", "REFUSED", "FAILED"].includes(t.status);
    const task = await db.agentTask.create({
      data: {
        title: t.title,
        prompt: t.prompt,
        status: t.status,
        targetScopes: t.scopes,
        branchName: t.branchName,
        iterations: t.iterations,
        tokensUsed: t.tokensUsed,
        createdAt,
        updatedAt: createdAt,
        startedAt: t.iterations > 0 ? createdAt : null,
        completedAt: finished ? new Date(createdAt.getTime() + t.iterations * 60_000) : null,
      },
    });
    let cursor = createdAt.getTime();
    let seq = 0;
    for (const ev of t.events) {
      seq += 1;
      cursor += 8_000 + Math.floor(Math.random() * 90_000);
      await db.agentEvent.create({
        data: {
          taskId: task.id,
          seq,
          type: ev.type,
          summary: ev.summary,
          createdAt: new Date(cursor),
        },
      });
    }
  }
}

async function main() {
  await seedScheduled();
  await seedAgentTasks();
  console.log("\n✅ Scheduled payments + agent tasks tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
