/**
 * AgentTask + AgentEvent rich-timeline seed.
 *
 * Mevcut agent task'ları siler, daha zengin akışlarla yeniden yaratır.
 * Her MERGED task ~20-26 event içerir (plan → pre-read → list_dir/grep/
 * read_file → edit/write → tsc gate → e2e → commit → tunnel → screenshot →
 * status MERGED). REFUSED/REJECTED/CANCELLED/FAILED daha kısa ama yine
 * gerçekçi akışlarla.
 *
 *   pnpm tsx --env-file=.env.local prisma/seed-agent-rich.ts
 */
import { PrismaClient, AgentTaskStatus, type AgentEventType } from "@prisma/client";

const db = new PrismaClient();

// ───────────── Helpers ─────────────

type Ev = { type: AgentEventType; summary: string; payload?: Record<string, unknown> };

function rngSeed(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rng = rngSeed(20260513);
const rint = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

// ───────────── Event templates ─────────────

function planEvents(opts: { kind: "ui" | "ui+data" | "data"; steps: number; scopes: string[]; expectedFiles: string[] }): Ev[] {
  return [
    {
      type: "STATUS",
      summary: "Planlama başladı (Gemini 2.5 Pro)",
      payload: { stage: "planning" },
    },
    {
      type: "THINK",
      summary: `Plan: ${opts.steps} adım, ${opts.scopes.length} scope — feasible`,
      payload: { kind: opts.kind, steps: opts.steps, scopes: opts.scopes.length, feasible: true },
    },
    {
      type: "NOTE",
      summary: `Scope seçildi: ${opts.scopes.join(", ")}`,
      payload: { scopes: opts.scopes, kind: opts.kind },
    },
    {
      type: "NOTE",
      summary: `Pre-read: ${opts.expectedFiles.length} dosya okunuyor…`,
      payload: { files: opts.expectedFiles },
    },
    ...opts.expectedFiles.map<Ev>((f) => ({
      type: "TOOL_RESULT",
      summary: `read_file: ${f}`,
      payload: { tool: "read_file", path: f, bytes: rint(800, 12000), truncated: false },
    })),
  ];
}

function readFileSeq(path: string): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `read_file: ${path}`,
      payload: { tool: "read_file", args: { path } },
    },
    {
      type: "TOOL_RESULT",
      summary: `${path} okundu`,
      payload: { tool: "read_file", path, bytes: rint(500, 9000) },
    },
  ];
}

function listDirSeq(path: string): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `list_dir: ${path}`,
      payload: { tool: "list_dir", args: { path } },
    },
    {
      type: "TOOL_RESULT",
      summary: `${path} listelendi`,
      payload: { tool: "list_dir", entries: rint(3, 18) },
    },
  ];
}

function grepSeq(pattern: string, path?: string): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `grep "${pattern}"${path ? ` in ${path}` : ""}`,
      payload: { tool: "grep", args: { pattern, path } },
    },
    {
      type: "TOOL_RESULT",
      summary: `${rint(0, 12)} eşleşme`,
      payload: { tool: "grep", hits: rint(0, 12) },
    },
  ];
}

function editSeq(path: string, opts: { added: number; removed: number; replaceAll?: boolean }): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `edit_file: ${path}`,
      payload: {
        tool: "edit_file",
        args: { path, old_string_bytes: rint(40, 250), new_string_bytes: rint(40, 320) },
      },
    },
    {
      type: "FILE_WRITE",
      summary: `Edit: ${path}`,
      payload: { path, added: opts.added, removed: opts.removed, replacements: opts.replaceAll ? rint(2, 4) : 1 },
    },
    {
      type: "TOOL_RESULT",
      summary: `${path} güncellendi, +${opts.added} satır${opts.removed > 0 ? `, -${opts.removed} satır` : ""}`,
      payload: { ok: true, message: `${path} güncellendi` },
    },
  ];
}

function writeSeq(path: string, lines: number): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `write_file: ${path}`,
      payload: { tool: "write_file", args: { path, content_bytes: lines * rint(25, 55) } },
    },
    {
      type: "FILE_WRITE",
      summary: `Oluşturuldu: ${path}`,
      payload: { path, bytes: lines * 40, created: true },
    },
    {
      type: "TOOL_RESULT",
      summary: `${path} oluşturuldu (${lines} satır)`,
      payload: { ok: true, message: `${path} oluşturuldu` },
    },
  ];
}

function finishSeq(summary: string): Ev[] {
  return [
    {
      type: "TOOL_CALL",
      summary: `finish: ${summary.slice(0, 60)}`,
      payload: { tool: "finish", args: { summary } },
    },
    {
      type: "STATUS",
      summary: "Finish öncesi TypeScript kontrolü…",
      payload: { stage: "tsc-gate" },
    },
  ];
}

function tscPass(): Ev[] {
  return [
    {
      type: "NOTE",
      summary: "TypeScript temiz (0 hata)",
      payload: { tsc: "clean", errorCount: 0 },
    },
  ];
}

function rscPass(): Ev[] {
  return [
    {
      type: "NOTE",
      summary: "RSC lint geçti (server/client karışıklığı yok)",
      payload: { rsc: "clean" },
    },
  ];
}

function e2eSeq(specs: string[], passed: number, total: number, screenshots: number): Ev[] {
  return [
    {
      type: "STATUS",
      summary: `E2E test başlıyor: ${specs.length} spec`,
      payload: { specs },
    },
    {
      type: "TEST_RUN",
      summary: `Playwright: ${passed}/${total} geçti`,
      payload: { total, passed, failed: total - passed, durationMs: rint(4000, 11000) },
    },
    {
      type: "SCREENSHOT",
      summary: `${screenshots} ekran görüntüsü alındı`,
      payload: { count: screenshots, source: "dynamic" },
    },
  ];
}

function commitSeq(sha: string, message: string, files: number): Ev[] {
  return [
    {
      type: "COMMIT",
      summary: `${message}`,
      payload: { sha, files },
    },
  ];
}

function tunnelSeq(slug: string): Ev[] {
  return [
    {
      type: "STATUS",
      summary: "Cloudflared tunnel açılıyor…",
      payload: { port: 3100 },
    },
    {
      type: "TUNNEL",
      summary: `Tunnel hazır: https://${slug}.trycloudflare.com`,
      payload: { url: `https://${slug}.trycloudflare.com` },
    },
  ];
}

function finalStatus(label: AgentTaskStatus): Ev[] {
  const text: Record<AgentTaskStatus, string> = {
    PENDING: "Beklemede",
    PLANNING: "Planlanıyor",
    RUNNING: "Çalışıyor",
    TESTING: "Test ediliyor",
    REVIEW: "Önizleme hazır — onay bekliyor",
    MERGED: "Onaylandı, main'e merge edildi",
    REJECTED: "Kullanıcı reddetti — değişiklikler geri alındı",
    CANCELLED: "Kullanıcı tarafından durduruldu",
    REFUSED: "Planner reddetti (güvenlik / scope)",
    FAILED: "Sistem hatası",
  };
  return [
    {
      type: "STATUS",
      summary: text[label],
      payload: { to: label },
    },
  ];
}

// ───────────── Tasks ─────────────

type Blueprint = {
  title: string;
  prompt: string;
  status: AgentTaskStatus;
  scopes: string[];
  branchName: string | null;
  iterations: number;
  tokensUsed: number;
  agoH: number;
  events: Ev[];
  screenshots?: number;
  tests?: { passed: number; total: number };
};

function shaShort(): string {
  return Array.from({ length: 7 }, () => "0123456789abcdef"[rint(0, 15)]).join("");
}

const BLUEPRINTS: Blueprint[] = [
  // 1. Hero banner
  {
    title: "Anasayfa hero bahar koleksiyon banner'ı",
    prompt: "/shop ana sayfada hero alanına 'Bahar 2026 — yeni keten koleksiyon' başlığı ve CTA butonu eklensin.",
    status: "MERGED",
    scopes: ["shop_home"],
    branchName: "agent/hero-bahar-banner",
    iterations: 5,
    tokensUsed: 12340,
    agoH: 2,
    screenshots: 1,
    tests: { passed: 8, total: 8 },
    events: [
      ...planEvents({ kind: "ui", steps: 3, scopes: ["shop_home"], expectedFiles: ["web/app/shop/page.tsx"] }),
      ...listDirSeq("web/app/shop/components"),
      ...readFileSeq("web/app/shop/components/product-card.tsx"),
      ...grepSeq("Bahar 2026", "web/app/shop"),
      ...editSeq("web/app/shop/page.tsx", { added: 12, removed: 4 }),
      ...editSeq("web/app/shop/page.tsx", { added: 6, removed: 0 }),
      ...finishSeq("Hero başlığı ve CTA güncellendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/shop/home.spec.ts"], 8, 8, 1),
      ...commitSeq(shaShort(), "agent: Hero bahar banner'ı", 1),
      ...tunnelSeq("agent-hero-bahar"),
      ...finalStatus("MERGED"),
    ],
  },
  // 2. Beden tablosu modal
  {
    title: "Ürün detay sayfasına beden tablosu",
    prompt: "/shop/p/[slug] ürün detayında 'Beden tablosu' modal'ı açan link eklensin. Modal'da S/M/L/XL ölçüleri olsun.",
    status: "MERGED",
    scopes: ["shop_product"],
    branchName: "agent/beden-tablosu-modal",
    iterations: 8,
    tokensUsed: 22890,
    agoH: 7,
    screenshots: 2,
    tests: { passed: 9, total: 9 },
    events: [
      ...planEvents({ kind: "ui", steps: 4, scopes: ["shop_product"], expectedFiles: ["web/app/shop/p/[slug]/page.tsx"] }),
      ...listDirSeq("web/components/ui"),
      ...readFileSeq("web/components/ui/modal.tsx"),
      ...readFileSeq("web/app/shop/p/[slug]/page.tsx"),
      ...writeSeq("web/app/shop/p/[slug]/size-modal.tsx", 86),
      ...editSeq("web/app/shop/p/[slug]/page.tsx", { added: 8, removed: 0 }),
      ...editSeq("web/app/shop/p/[slug]/size-modal.tsx", { added: 3, removed: 1 }),
      ...finishSeq("Beden tablosu modal'ı eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/shop/product.spec.ts"], 9, 9, 2),
      ...commitSeq(shaShort(), "agent: Beden tablosu modal'ı", 2),
      ...tunnelSeq("agent-beden-tablo"),
      ...finalStatus("MERGED"),
    ],
  },
  // 3. Toplu kargo
  {
    title: "Sipariş listesinde toplu kargo aksiyonu",
    prompt: "/admin/orders'ta checkbox'la seçilen siparişleri tek hamlede 'Kargoya verildi' durumuna geçirsin.",
    status: "MERGED",
    scopes: ["admin_orders"],
    branchName: "agent/toplu-kargo-aksiyonu",
    iterations: 7,
    tokensUsed: 18420,
    agoH: 14,
    screenshots: 2,
    tests: { passed: 12, total: 12 },
    events: [
      ...planEvents({ kind: "ui+data", steps: 4, scopes: ["admin_orders"], expectedFiles: ["web/app/(admin)/admin/orders/page.tsx", "web/app/(admin)/admin/orders/orders-table.tsx"] }),
      ...readFileSeq("web/lib/actions/orders.ts"),
      ...grepSeq("updateOrderStatus", "web/lib"),
      ...editSeq("web/app/(admin)/admin/orders/orders-table.tsx", { added: 24, removed: 6 }),
      ...writeSeq("web/app/(admin)/admin/orders/bulk-actions.tsx", 64),
      ...editSeq("web/lib/actions/orders.ts", { added: 18, removed: 0 }),
      ...finishSeq("Toplu kargo aksiyonu eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/orders/orders-crud.spec.ts"], 12, 12, 2),
      ...commitSeq(shaShort(), "agent: Toplu kargo aksiyonu", 3),
      ...tunnelSeq("agent-toplu-kargo"),
      ...finalStatus("MERGED"),
    ],
  },
  // 4. Stok kritik vurgu
  {
    title: "Stok kritik vurgusu — ürün listesi",
    prompt: "Ürün listesinde stok 5'in altındaki ürünler turuncu badge ile vurgulansın. Filtreye 'sadece kritik' seçeneği eklensin.",
    status: "MERGED",
    scopes: ["admin_products"],
    branchName: "agent/stok-kritik-vurgu",
    iterations: 5,
    tokensUsed: 12880,
    agoH: 21,
    screenshots: 1,
    tests: { passed: 7, total: 7 },
    events: [
      ...planEvents({ kind: "ui", steps: 3, scopes: ["admin_products"], expectedFiles: ["web/app/(admin)/admin/products/products-table.tsx"] }),
      ...readFileSeq("web/components/ui/badge.tsx"),
      ...editSeq("web/app/(admin)/admin/products/products-table.tsx", { added: 14, removed: 2 }),
      ...editSeq("web/app/(admin)/admin/products/filter-bar.tsx", { added: 9, removed: 0 }),
      ...finishSeq("Stok kritik vurgu eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/products/products-crud.spec.ts"], 7, 7, 1),
      ...commitSeq(shaShort(), "agent: Stok kritik vurgu", 2),
      ...tunnelSeq("agent-stok-kritik"),
      ...finalStatus("MERGED"),
    ],
  },
  // 5. Sepet boşaltma onayı
  {
    title: "Sepet boşaltma onay diyaloğu",
    prompt: "Sepet sayfasında 'Sepeti boşalt' butonu önce onay diyaloğu açsın. Yanlışlıkla tıklamayı engelle.",
    status: "MERGED",
    scopes: ["shop_cart"],
    branchName: "agent/sepet-bosalt-onay",
    iterations: 4,
    tokensUsed: 8650,
    agoH: 32,
    screenshots: 1,
    tests: { passed: 6, total: 6 },
    events: [
      ...planEvents({ kind: "ui", steps: 2, scopes: ["shop_cart"], expectedFiles: ["web/app/shop/cart/cart-summary.tsx"] }),
      ...readFileSeq("web/components/ui/modal.tsx"),
      ...editSeq("web/app/shop/cart/cart-summary.tsx", { added: 22, removed: 4 }),
      ...finishSeq("Onay diyaloğu eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/shop/cart-checkout.spec.ts"], 6, 6, 1),
      ...commitSeq(shaShort(), "agent: Sepet boşaltma onay diyaloğu", 1),
      ...tunnelSeq("agent-sepet-onay"),
      ...finalStatus("MERGED"),
    ],
  },
  // 6. Son sipariş özet
  {
    title: "Müşteri detayında son sipariş özeti",
    prompt: "/admin/customers/[id] sayfasında müşterinin son 3 siparişinin özet kartını üst kısma ekle.",
    status: "MERGED",
    scopes: ["admin_customers"],
    branchName: "agent/musteri-son-siparis-ozet",
    iterations: 6,
    tokensUsed: 16240,
    agoH: 48,
    screenshots: 2,
    tests: { passed: 8, total: 8 },
    events: [
      ...planEvents({ kind: "ui", steps: 3, scopes: ["admin_customers"], expectedFiles: ["web/app/(admin)/admin/customers/[id]/page.tsx"] }),
      ...readFileSeq("web/lib/queries/customers.ts"),
      ...grepSeq("findOrdersByCustomerId", "web/lib"),
      ...writeSeq("web/app/(admin)/admin/customers/[id]/recent-orders-card.tsx", 72),
      ...editSeq("web/app/(admin)/admin/customers/[id]/page.tsx", { added: 6, removed: 0 }),
      ...finishSeq("Son sipariş özeti kartı eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/customers/customers-crud.spec.ts"], 8, 8, 2),
      ...commitSeq(shaShort(), "agent: Son sipariş özeti kartı", 2),
      ...tunnelSeq("agent-musteri-ozet"),
      ...finalStatus("MERGED"),
    ],
  },
  // 7. İade sebebi
  {
    title: "İade sebebi seçimi — admin iade akışı",
    prompt: "Admin iade işlerken sebep dropdown'undan seçim yapabilsin: defective, wrong_item, customer_request, other.",
    status: "MERGED",
    scopes: ["admin_orders"],
    branchName: "agent/iade-sebep-secimi",
    iterations: 5,
    tokensUsed: 11200,
    agoH: 72,
    screenshots: 1,
    tests: { passed: 9, total: 9 },
    events: [
      ...planEvents({ kind: "ui", steps: 3, scopes: ["admin_orders"], expectedFiles: ["web/app/(admin)/admin/orders/[id]/refund-form.tsx"] }),
      ...readFileSeq("web/prisma/schema.prisma"),
      ...grepSeq("enum RefundReason", "web/prisma"),
      ...editSeq("web/app/(admin)/admin/orders/[id]/refund-form.tsx", { added: 18, removed: 4 }),
      ...editSeq("web/lib/actions/refunds.ts", { added: 6, removed: 0 }),
      ...finishSeq("İade sebebi seçimi eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/orders/orders-crud.spec.ts"], 9, 9, 1),
      ...commitSeq(shaShort(), "agent: İade sebebi seçimi", 2),
      ...tunnelSeq("agent-iade-sebep"),
      ...finalStatus("MERGED"),
    ],
  },
  // 8. Footer sosyal ikonlar
  {
    title: "Footer sosyal medya ikonları",
    prompt: "Shop footer'ında Instagram, TikTok, Pinterest ikonları olsun, dış bağlantılar açılsın.",
    status: "MERGED",
    scopes: ["shop_shared"],
    branchName: "agent/footer-sosyal-ikonlar",
    iterations: 3,
    tokensUsed: 6920,
    agoH: 96,
    screenshots: 1,
    tests: { passed: 5, total: 5 },
    events: [
      ...planEvents({ kind: "ui", steps: 2, scopes: ["shop_shared"], expectedFiles: ["web/app/shop/components/footer.tsx"] }),
      ...grepSeq("lucide-react.*Instagram", "web"),
      ...editSeq("web/app/shop/components/footer.tsx", { added: 16, removed: 2 }),
      ...finishSeq("Sosyal medya ikonları eklendi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/shop/shared.spec.ts"], 5, 5, 1),
      ...commitSeq(shaShort(), "agent: Footer sosyal ikonlar", 1),
      ...tunnelSeq("agent-footer-sosyal"),
      ...finalStatus("MERGED"),
    ],
  },

  // ─── REFUSED #1 — auth kaldırma ───
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
        summary: "Planlama başladı (Gemini 2.5 Pro)",
        payload: { stage: "planning" },
      },
      {
        type: "THINK",
        summary: "Auth kaldırma talebi — güvenlik politikasına aykırı",
        payload: { kind: "uncertain", feasible: false },
      },
      {
        type: "STATUS",
        summary: "Reddedildi: Auth kaldırma — güvenlik politikası gereği yapılmaz.",
        payload: { to: "REFUSED", reason: "auth-bypass" },
      },
    ],
  },

  // ─── REFUSED #2 — toplu mail ───
  {
    title: "Tüm müşterilere ücretsiz kargo kuponu maille at",
    prompt: "Veritabanındaki bütün müşterilere otomatik mail gönder, kupon kodu içersin, bireysel kişisel kod olsun.",
    status: "REFUSED",
    scopes: [],
    branchName: null,
    iterations: 0,
    tokensUsed: 0,
    agoH: 60,
    events: [
      {
        type: "STATUS",
        summary: "Planlama başladı",
        payload: { stage: "planning" },
      },
      {
        type: "THINK",
        summary: "Toplu DB + mail operasyonu — UI bağımsız",
        payload: { kind: "data", feasible: false },
      },
      {
        type: "STATUS",
        summary: "Reddedildi: UI-bağımsız toplu DB+mail operasyonu agent yetkisinde değil; admin paneline kontrol UI'ı önerilir.",
        payload: { to: "REFUSED", reason: "bulk-data" },
      },
    ],
  },

  // ─── REJECTED — kullanıcı geri çevirdi ───
  {
    title: "Anasayfa başlığı değiştir",
    prompt: "Hero başlığını 'Sade üstün kalan' yerine 'Anadolu pamuğu sade kalır' yap.",
    status: "REJECTED",
    scopes: ["shop_home"],
    branchName: "agent/hero-baslik-degisikligi",
    iterations: 3,
    tokensUsed: 5640,
    agoH: 84,
    screenshots: 1,
    tests: { passed: 5, total: 5 },
    events: [
      ...planEvents({ kind: "ui", steps: 1, scopes: ["shop_home"], expectedFiles: ["web/app/shop/page.tsx"] }),
      ...editSeq("web/app/shop/page.tsx", { added: 1, removed: 1 }),
      ...finishSeq("Başlık değiştirildi."),
      ...tscPass(),
      ...rscPass(),
      ...e2eSeq(["tests/e2e/specs/shop/home.spec.ts"], 5, 5, 1),
      ...commitSeq(shaShort(), "agent: Hero başlığı güncellendi", 1),
      ...tunnelSeq("agent-hero-baslik"),
      {
        type: "STATUS",
        summary: "Önizleme açıldı, kullanıcı onayı bekleniyor",
        payload: { to: "REVIEW" },
      },
      {
        type: "STATUS",
        summary: "Kullanıcı reddetti: eski metin tercih edildi.",
        payload: { to: "REJECTED", feedback: "Eski sloganı koruyalım." },
      },
    ],
  },

  // ─── FAILED — prisma migration gerekli ───
  {
    title: "Yeni 'isVip' alanı ekle — müşteri tablosu",
    prompt: "Müşteriye 'isVip: boolean' alanı ekle ve admin filtrelemesinde kullan.",
    status: "FAILED",
    scopes: ["admin_customers"],
    branchName: "agent/musteri-isvip-alan",
    iterations: 11,
    tokensUsed: 28780,
    agoH: 100,
    events: [
      ...planEvents({ kind: "ui+data", steps: 5, scopes: ["admin_customers"], expectedFiles: ["web/app/(admin)/admin/customers/customers-table.tsx"] }),
      ...readFileSeq("web/prisma/schema.prisma"),
      ...grepSeq("model Customer", "web/prisma"),
      ...editSeq("web/app/(admin)/admin/customers/customers-table.tsx", { added: 22, removed: 4 }),
      ...editSeq("web/app/(admin)/admin/customers/filter-bar.tsx", { added: 8, removed: 0 }),
      ...finishSeq("VIP alanı için filtre eklendi."),
      {
        type: "STATUS",
        summary: "Finish öncesi TypeScript kontrolü…",
        payload: { stage: "tsc-gate" },
      },
      {
        type: "ERROR",
        summary: "TypeScript hatası (4): Property 'isVip' does not exist on type 'Customer'",
        payload: { tsc: "fail", errorCount: 4, retry: 1 },
      },
      ...grepSeq("isVip", "web/prisma"),
      {
        type: "NOTE",
        summary: "'isVip' alanı schema'da yok — prisma migration gerek",
        payload: { warning: "missing-field" },
      },
      {
        type: "ERROR",
        summary: "Max 5 tsc denemesi doldu, schema değişikliği agent'a kapalı",
        payload: { tsc: "max-retries", errorCount: 4 },
      },
      {
        type: "STATUS",
        summary: "Sistem hatası: Schema alanı eklemek için prisma migration gerekiyor — agent yetkisinde değil.",
        payload: { to: "FAILED", reason: "schema-change-needed" },
      },
    ],
  },

  // ─── CANCELLED — kullanıcı durdurdu ───
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
      ...planEvents({ kind: "ui+data", steps: 6, scopes: ["shop_shared"], expectedFiles: ["web/lib/format.ts"] }),
      ...readFileSeq("web/lib/format.ts"),
      ...editSeq("web/lib/format.ts", { added: 14, removed: 2 }),
      {
        type: "STATUS",
        summary: "Kullanıcı tarafından durduruldu (kapsam değişti).",
        payload: { to: "CANCELLED", reason: "user-cancelled" },
      },
    ],
  },
];

// ───────────── Run ─────────────

async function main() {
  console.log("[agent-rich] eski task'lar siliniyor…");
  await db.agentScreenshot.deleteMany().catch(() => {});
  await db.agentTestRun.deleteMany().catch(() => {});
  await db.agentEvent.deleteMany();
  await db.agentTask.deleteMany();

  console.log(`[agent-rich] ${BLUEPRINTS.length} task seed ediliyor (zengin akış)…`);
  for (const t of BLUEPRINTS) {
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
        completedAt: finished
          ? new Date(createdAt.getTime() + t.iterations * 60_000)
          : null,
      },
    });

    // Eventlar — gerçekçi zaman aralıkları
    const totalDurationMs = (t.iterations || 1) * 60_000;
    const stepMs = Math.max(1500, Math.floor(totalDurationMs / t.events.length));
    let cursor = createdAt.getTime();
    let seq = 0;
    for (const ev of t.events) {
      seq += 1;
      cursor += stepMs + rint(-2000, 5000);
      await db.agentEvent.create({
        data: {
          taskId: task.id,
          seq,
          type: ev.type,
          summary: ev.summary,
          payload: (ev.payload as never) ?? undefined,
          createdAt: new Date(cursor),
        },
      });
    }

    // Screenshots
    if (t.screenshots && t.screenshots > 0) {
      for (let i = 0; i < t.screenshots; i++) {
        await db.agentScreenshot
          .create({
            data: {
              taskId: task.id,
              label: `Önizleme ${i + 1}`,
              path: `/agent-screenshots/${task.id}/preview-${i + 1}.png`,
              width: 1280,
              height: 720,
              createdAt: new Date(cursor - rint(10_000, 60_000)),
            },
          })
          .catch(() => {});
      }
    }

    // Test runs
    if (t.tests) {
      await db.agentTestRun
        .create({
          data: {
            taskId: task.id,
            name: "playwright e2e",
            status: t.tests.passed === t.tests.total ? "PASSED" : "FAILED",
            durationMs: rint(4000, 11000),
            output: `${t.tests.passed}/${t.tests.total} geçti`,
            createdAt: new Date(cursor - rint(5000, 25000)),
          },
        })
        .catch(() => {});
    }
  }

  console.log("✅ Tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
