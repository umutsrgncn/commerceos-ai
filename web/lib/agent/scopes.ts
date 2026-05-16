/**
 * Agent'ın yazabileceği sayfa/alan kataloğu.
 *
 * Kullanıcı listeden seçer, agent yalnızca seçilen scope'ların
 * `writeGlobs` path'lerine yazabilir. Seçilen scope yoksa hiçbir yere yazamaz.
 *
 * Her scope agent'a kısa Türkçe bir açıklama sunar — agent path'leri tahmin
 * etmek yerine bu açıklamadan başlar.
 */

export type AgentScopeGroup = "shop" | "admin" | "shared";

export type AgentScope = {
  id: string;
  group: AgentScopeGroup;
  label: string; // kullanıcıya
  shortDesc: string; // kullanıcıya, satır altı
  /** Agent system prompt'una eklenir — bu sayfanın ne olduğunu açıklar */
  agentBriefing: string;
  /** Regex'ler — bu scope seçildiğinde yazılabilen UI dosyaları */
  writeGlobs: RegExp[];
  /** Regex'ler — opsiyonel backend (lib/ vs.) dosyaları. UI ile birlikte mantıklı server action / helper yazılması için. */
  libGlobs?: RegExp[];
  /** Bu scope etkilendiğinde çalıştırılacak Playwright spec dosyaları (web/ kök referansla). */
  e2eSpecs?: string[];
};

export const AGENT_SCOPES: AgentScope[] = [
  // ─── SHOP (müşteri tarafı) ───
  {
    id: "shop_home",
    group: "shop",
    label: "Shop · Ana sayfa",
    shortDesc: "Hero, öne çıkan kategoriler, ürün gridleri",
    agentBriefing:
      "Müşteri storefront'unun açılış sayfası. Hero bölümü, öne çıkan kategoriler ve son ürünler burada. Dosya: web/app/shop/page.tsx.",
    writeGlobs: [
      /^web\/app\/shop\/page\.tsx$/,
      /^web\/app\/shop\/components\/(hero|featured|home-|landing)/,
    ],
    e2eSpecs: ["tests/e2e/specs/shop/home.spec.ts"],
  },
  {
    id: "shop_category",
    group: "shop",
    label: "Shop · Kategori sayfası",
    shortDesc: "/shop/c/[slug] — ürün listesi, filtreler",
    agentBriefing:
      "Kategori detay sayfası — ürünleri listeler, filtre/sıralama bulunur. Dosya: web/app/shop/c/[slug]/page.tsx, web/app/shop/c/page.tsx.",
    writeGlobs: [
      /^web\/app\/shop\/c\//,
    ],
    e2eSpecs: ["tests/e2e/specs/shop/category.spec.ts"],
  },
  {
    id: "shop_product",
    group: "shop",
    label: "Shop · Ürün detay",
    shortDesc: "/shop/p/[slug] — galeri, varyant, sepete ekle",
    agentBriefing:
      "Ürün detay sayfası — görsel galeri, varyant seçimi, sepete ekle butonu. Dosya: web/app/shop/p/[slug]/page.tsx + buy-actions.tsx. Backend: web/lib/shop/wishlist*.ts.",
    writeGlobs: [
      /^web\/app\/shop\/p\//,
      /^web\/app\/shop\/components\/(buy-actions|product-)/,
    ],
    libGlobs: [/^web\/lib\/shop\/wishlist/],
    e2eSpecs: ["tests/e2e/specs/shop/product.spec.ts"],
  },
  {
    id: "shop_cart_checkout",
    group: "shop",
    label: "Shop · Sepet & checkout",
    shortDesc: "Sepet drawer, /shop/cart, /shop/checkout, başarı sayfası",
    agentBriefing:
      "Sepet ve checkout akışı. Dosyalar: web/app/shop/cart/, web/app/shop/checkout/, web/app/shop/components/cart-*.tsx. Server actions: web/lib/shop/cart-*.ts.",
    writeGlobs: [
      /^web\/app\/shop\/cart\//,
      /^web\/app\/shop\/checkout\//,
      /^web\/app\/shop\/components\/cart-/,
    ],
    libGlobs: [/^web\/lib\/shop\/cart/],
    e2eSpecs: ["tests/e2e/specs/shop/cart-checkout.spec.ts"],
  },
  {
    id: "shop_account",
    group: "shop",
    label: "Shop · Hesap",
    shortDesc: "/shop/account — profil, siparişler, adresler, favoriler, ayarlar",
    agentBriefing:
      "Müşteri hesap merkezi. Profil, sipariş geçmişi, adresler, favoriler, ayarlar. Dosya: web/app/shop/account/. Server actions: web/lib/shop/account-actions.ts, address-actions.ts.",
    writeGlobs: [/^web\/app\/shop\/account\//],
    libGlobs: [
      /^web\/lib\/shop\/account/,
      /^web\/lib\/shop\/address/,
    ],
    e2eSpecs: ["tests/e2e/specs/shop/account.spec.ts"],
  },
  {
    id: "shop_auth",
    group: "shop",
    label: "Shop · Giriş / Kayıt",
    shortDesc: "/shop/auth — login, register formları",
    agentBriefing:
      "Müşteri auth formları (UI). Login ve register sayfaları. Dosya: web/app/shop/auth/. Server actions: web/lib/shop/auth-actions.ts (sadece form-side, NextAuth dokunulmaz).",
    writeGlobs: [
      /^web\/app\/shop\/auth\/.+\/page\.tsx$/,
      /^web\/app\/shop\/auth\/.+\.tsx$/,
    ],
    libGlobs: [/^web\/lib\/shop\/auth-actions\.ts$/],
    e2eSpecs: ["tests/e2e/specs/shop/auth-info-footer.spec.ts"],
  },
  {
    id: "shop_info",
    group: "shop",
    label: "Shop · Bilgi sayfaları",
    shortDesc: "Yardım, iade, kargo, KVKK, iletişim",
    agentBriefing:
      "Footer'daki bilgi sayfaları: /shop/yardim, /shop/iade, /shop/kargo, /shop/kvkk, /shop/iletisim. Dosya: web/app/shop/(info)/.",
    writeGlobs: [/^web\/app\/shop\/\(info\)\//],
    e2eSpecs: ["tests/e2e/specs/shop/auth-info-footer.spec.ts"],
  },
  {
    id: "shop_footer_header",
    group: "shop",
    label: "Shop · Header & Footer",
    shortDesc: "Üst nav + alt footer (tüm shop sayfalarında)",
    agentBriefing:
      "Shop'un tüm sayfalarında görünen üst header ve alt footer. Dosyalar: web/app/shop/components/shop-header.tsx, shop-footer.tsx.",
    writeGlobs: [/^web\/app\/shop\/components\/shop-(header|footer)\.tsx$/],
    e2eSpecs: ["tests/e2e/specs/shop/auth-info-footer.spec.ts", "tests/e2e/specs/shop/home.spec.ts"],
  },
  {
    id: "shop_theme",
    group: "shop",
    label: "Shop · Tema / Stil",
    shortDesc: "Renk paleti, dark/light toggle, layout",
    agentBriefing:
      "Shop genelindeki stil ve tema. Dosya: web/app/shop/layout.tsx, web/app/shop/theme-toggle.tsx.",
    writeGlobs: [
      /^web\/app\/shop\/layout\.tsx$/,
      /^web\/app\/shop\/theme-toggle\.tsx$/,
    ],
    e2eSpecs: ["tests/e2e/specs/shop/theme.spec.ts", "tests/e2e/specs/shop/home.spec.ts"],
  },

  // ─── ADMIN (yönetici tarafı) ───
  {
    id: "admin_dashboard",
    group: "admin",
    label: "Admin · Dashboard",
    shortDesc: "Ana özet kartları, son siparişler, KPI'lar",
    agentBriefing:
      "Admin paneli açılış sayfası. KPI kartları, satış grafiği, son siparişler. Dosya: web/app/(admin)/admin/page.tsx. Queries: web/lib/queries/dashboard.ts.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/page\.tsx$/],
    libGlobs: [/^web\/lib\/queries\/dashboard/],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_products",
    group: "admin",
    label: "Admin · Ürünler",
    shortDesc: "Ürün listesi, ekle, düzenle",
    agentBriefing:
      "Ürün yönetimi sayfaları. Dosya: web/app/(admin)/admin/products/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/products\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts", "tests/e2e/specs/admin-smoke/admin-detail-routes.spec.ts"],
  },
  {
    id: "admin_inventory",
    group: "admin",
    label: "Admin · Envanter",
    shortDesc: "Stok takibi, yavaş hareket eden ürünler",
    agentBriefing:
      "Envanter ve stok yönetimi. Dosya: web/app/(admin)/admin/inventory/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/inventory\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_orders",
    group: "admin",
    label: "Admin · Siparişler",
    shortDesc: "Sipariş listesi, durum, kargo, iade",
    agentBriefing:
      "Sipariş yönetimi sayfaları. Dosya: web/app/(admin)/admin/orders/. Queries: web/lib/queries/orders.ts.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/orders\//],
    libGlobs: [/^web\/lib\/queries\/orders/],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts", "tests/e2e/specs/admin-smoke/admin-detail-routes.spec.ts"],
  },
  {
    id: "admin_customers",
    group: "admin",
    label: "Admin · Müşteriler",
    shortDesc: "Müşteri listesi, segmentasyon, profil",
    agentBriefing:
      "Müşteri yönetimi. Dosya: web/app/(admin)/admin/customers/. Queries: web/lib/queries/customers*.ts.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/customers\//],
    libGlobs: [/^web\/lib\/queries\/(customer|customers)/],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts", "tests/e2e/specs/admin-smoke/admin-detail-routes.spec.ts"],
  },
  {
    id: "admin_categories",
    group: "admin",
    label: "Admin · Kategoriler",
    shortDesc: "Kategori CRUD, görseller",
    agentBriefing:
      "Kategori yönetimi. Dosya: web/app/(admin)/admin/categories/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/categories\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts", "tests/e2e/specs/admin-smoke/admin-detail-routes.spec.ts"],
  },
  {
    id: "admin_discounts",
    group: "admin",
    label: "Admin · İndirimler",
    shortDesc: "Kupon yönetimi",
    agentBriefing: "İndirim kuponları sayfası. Dosya: web/app/(admin)/admin/discounts/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/discounts\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_finance",
    group: "admin",
    label: "Admin · Finans",
    shortDesc: "Finans paneli, gelecek ödemeler, AI cashflow",
    agentBriefing:
      "Finans, gelecek ödemeler, AI Turnaround insight. Dosya: web/app/(admin)/admin/finance/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/finance\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts", "tests/e2e/specs/admin-smoke/admin-detail-routes.spec.ts"],
  },
  {
    id: "admin_analytics",
    group: "admin",
    label: "Admin · Analitik",
    shortDesc: "Satış grafiği, raporlar",
    agentBriefing: "Analitik sayfası. Dosya: web/app/(admin)/admin/analytics/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/analytics\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_autopilot",
    group: "admin",
    label: "Admin · Otopilot",
    shortDesc: "Otopilot canlı feed, kabiliyet kartları",
    agentBriefing:
      "Otopilot durumu, canlı feed, kabiliyetler. Dosya: web/app/(admin)/admin/autopilot/.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/autopilot\//],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_activity",
    group: "admin",
    label: "Admin · Aktivite",
    shortDesc: "Sistem aktivite log'u — agent task, otopilot aksiyon, audit",
    agentBriefing:
      "Aktivite log sayfası — agent task'lar, otopilot aksiyonlar, sistem audit. Dosya: web/app/(admin)/admin/activity/page.tsx. Queries: web/lib/queries/activity.ts.",
    writeGlobs: [/^web\/app\/\(admin\)\/admin\/activity\//],
    libGlobs: [/^web\/lib\/queries\/activity/],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },
  {
    id: "admin_sidebar",
    group: "shared",
    label: "Admin · Sidebar & Topbar",
    shortDesc: "Tüm admin sayfalarında görünen sidebar/topbar",
    agentBriefing:
      "Admin paneli layout (sidebar + topbar). Dosya: web/components/layout/sidebar.tsx, topbar.tsx, web/lib/nav.ts.",
    writeGlobs: [
      /^web\/components\/layout\/(sidebar|topbar)\.tsx$/,
      /^web\/lib\/nav\.ts$/,
    ],
    e2eSpecs: ["tests/e2e/specs/admin-smoke/admin-routes.spec.ts"],
  },

  // ─── SHARED ───
  {
    id: "landing",
    group: "shared",
    label: "Landing · Ana sayfa",
    shortDesc: "/ — hackathon tanıtım landing'i",
    agentBriefing:
      "Login-öncesi tanıtım landing sayfası. Dosya: web/app/page.tsx + landing components.",
    writeGlobs: [
      /^web\/app\/page\.tsx$/,
      /^web\/components\/landing\//,
    ],
    e2eSpecs: ["tests/e2e/specs/shop/shared.spec.ts"],
  },
  {
    id: "shared_ui",
    group: "shared",
    label: "Ortak · UI bileşenleri",
    shortDesc: "Button, Card, Input vb. paylaşılan bileşenler",
    agentBriefing:
      "Tüm projede kullanılan UI primitive'leri. Dosya: web/components/ui/.",
    writeGlobs: [/^web\/components\/ui\//],
    e2eSpecs: ["tests/e2e/specs/shop/shared.spec.ts"],
  },
  {
    id: "shared_brand",
    group: "shared",
    label: "Ortak · Marka (Logo)",
    shortDesc: "CommerceOS logosu",
    agentBriefing:
      "Marka bileşenleri (logo). Dosya: web/components/brand/.",
    writeGlobs: [/^web\/components\/brand\//],
    e2eSpecs: ["tests/e2e/specs/shop/shared.spec.ts"],
  },
];

const SCOPE_BY_ID = new Map(AGENT_SCOPES.map((s) => [s.id, s]));

export function getScopesByIds(ids: string[]): AgentScope[] {
  return ids.map((id) => SCOPE_BY_ID.get(id)).filter((s): s is AgentScope => !!s);
}

/**
 * Path verilen scope'ların yazılabilir glob'larıyla eşleşiyor mu?
 * Hem writeGlobs (UI dosyaları) hem libGlobs (backend dosyaları) kontrol edilir.
 *
 * GENEL KURAL: Bir scope kendi parent dizinindeki `_components/` ve `_lib/`
 * alt klasörlerine yazma yetkisine otomatik sahiptir. Next.js convention'ı:
 * `_` prefix'li klasörler route oluşturmaz, sadece yerel component/util barındırır.
 * Bu sayede agent "use client" gereken küçük komponentleri inline yapmak yerine
 * temiz şekilde ayrı dosya olarak yaratabilir.
 */
export function pathInScopes(p: string, scopes: AgentScope[]): boolean {
  const norm = p.replace(/^\/+/, "").replace(/\\/g, "/");
  for (const s of scopes) {
    for (const re of s.writeGlobs) {
      if (re.test(norm)) return true;
    }
    if (s.libGlobs) {
      for (const re of s.libGlobs) {
        if (re.test(norm)) return true;
      }
    }
  }
  // Helper alt klasör kuralı: norm bir _components/ veya _lib/ altındaysa
  // parent dizinde scope match'leniyorsa OK
  const helperMatch = norm.match(/^(.+\/)(?:_components|_lib)\//);
  if (helperMatch) {
    const parent = helperMatch[1]; // örn "web/app/(admin)/admin/"
    // Parent dir altındaki "page.tsx" herhangi bir scope writeGlob'una eşleşiyor mu?
    const testPaths = [parent + "page.tsx", parent.replace(/\/$/, "")];
    for (const s of scopes) {
      for (const re of s.writeGlobs) {
        if (testPaths.some((t) => re.test(t))) return true;
      }
    }
  }
  return false;
}

/**
 * Agent system prompt'una eklenmek üzere — seçili scope'ların adlandırılmış özetini döner.
 */
export function buildScopeBriefing(scopes: AgentScope[]): string {
  if (scopes.length === 0) return "Hiç scope seçilmedi — yazma yapılamaz.";
  return scopes
    .map((s, i) => `${i + 1}. ${s.label}\n   ${s.agentBriefing}`)
    .join("\n\n");
}

export function listScopeIds(): string[] {
  return AGENT_SCOPES.map((s) => s.id);
}

/**
 * Verilen scope'lar için çalıştırılacak benzersiz e2e spec dosyalarını döner.
 */
export function getE2eSpecsForScopes(scopes: AgentScope[]): string[] {
  const set = new Set<string>();
  for (const s of scopes) {
    for (const spec of s.e2eSpecs ?? []) set.add(spec);
  }
  return Array.from(set);
}
