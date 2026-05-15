import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export type ChangedPage = {
  /** Worktree-relatif dosya yolu */
  file: string;
  /** Tahmini URL — agent'ın dev server'ında goto için */
  url: string;
  /** Ekstra notlar (örn. dynamic route) */
  isDynamic: boolean;
};

/**
 * Worktree'de agent'ın bu task içinde değiştirdiği/oluşturduğu page.tsx dosyalarını çıkarır.
 * Returns: { file, url, isDynamic }
 *
 * Sadece UI sayfalarını döndürür (page.tsx). Server actions, component'ler atlanır.
 */
export async function getChangedPages(worktreeRoot: string): Promise<ChangedPage[]> {
  let changed: string[] = [];

  // git diff main..HEAD (commit'ten sonra) + index + untracked
  try {
    const { stdout: a } = await exec(
      "git",
      ["diff", "--name-only", "main", "HEAD"],
      { cwd: worktreeRoot, maxBuffer: 1024 * 1024 },
    );
    changed.push(...a.split("\n").filter(Boolean));
  } catch {}
  try {
    const { stdout: b } = await exec("git", ["diff", "--name-only"], {
      cwd: worktreeRoot,
      maxBuffer: 1024 * 1024,
    });
    for (const f of b.split("\n").filter(Boolean))
      if (!changed.includes(f)) changed.push(f);
  } catch {}
  try {
    const { stdout: c } = await exec(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: worktreeRoot, maxBuffer: 1024 * 1024 },
    );
    for (const f of c.split("\n").filter(Boolean))
      if (!changed.includes(f)) changed.push(f);
  } catch {}

  const pages: ChangedPage[] = [];
  for (const file of changed) {
    if (!/\/page\.tsx$/.test(file)) continue;
    if (!file.startsWith("web/app/")) continue;
    const url = pageFileToUrl(file);
    if (!url) continue;
    pages.push({
      file,
      url,
      isDynamic: url.includes("["),
    });
  }
  return pages;
}

/**
 * "web/app/shop/account/settings/page.tsx" → "/shop/account/settings"
 * "web/app/(admin)/admin/products/page.tsx" → "/admin/products"
 * "web/app/page.tsx" → "/"
 * "web/app/shop/(info)/yardim/page.tsx" → "/shop/yardim"
 */
function pageFileToUrl(file: string): string | null {
  let p = file.replace(/^web\/app\//, "").replace(/\/page\.tsx$/, "");
  // Remove route groups: (admin), (info), (auth) — bunlar URL'i etkilemez
  p = p
    .split("/")
    .filter((seg) => !/^\([^)]+\)$/.test(seg))
    .join("/");
  if (!p) return "/";
  return "/" + p;
}

/**
 * Dinamik route'ları çıkar — agent kendisi yarattığı için seed yok.
 * Sadece statik yolları test edebiliriz.
 */
export function filterTestable(pages: ChangedPage[]): ChangedPage[] {
  return pages.filter((p) => !p.isDynamic);
}

/**
 * Dinamik route'lardaki [id] / [slug] / [orderNumber] placeholder'ını
 * test DB'deki gerçek bir kayıtla doldurur. Çözülemezse null döner (skip).
 *
 * Örn: "/admin/customers/[id]" → "/admin/customers/cmp4..." (test DB'deki ilk Customer)
 */
export async function resolveDynamicUrl(
  url: string,
  testDbUrl: string,
): Promise<string | null> {
  if (!url.includes("[")) return url;
  // path segment'lere böl
  const segs = url.split("/").filter(Boolean);
  // [param] segment'in HEMEN ÖNCEKİ segmentini "resource" olarak al
  // /admin/customers/[id] → resource = "customers"
  // /shop/p/[slug] → resource = "p"
  // /admin/orders/[id]/edit → resource = "orders"
  const dynIdx = segs.findIndex((s) => s.startsWith("[") && s.endsWith("]"));
  if (dynIdx <= 0) return null;
  const param = segs[dynIdx].slice(1, -1).replace(/^\.\.\./, ""); // "id" / "slug"
  const resource = segs[dynIdx - 1];
  // resource → model mapping
  const MAP: Record<string, { table: string; field?: string }> = {
    customers: { table: "Customer" },
    orders: { table: "Order" },
    products: { table: "Product" },
    categories: { table: "Category" },
    p: { table: "Product", field: param === "slug" ? "slug" : "id" },
    c: { table: "Category", field: param === "slug" ? "slug" : "id" },
    discounts: { table: "Discount" },
    inventory: { table: "Product" },
  };
  const m = MAP[resource];
  if (!m) return null;
  const field = m.field ?? (param === "slug" ? "slug" : param === "orderNumber" ? "orderNumber" : "id");
  // Test DB'den ilk row'u çek
  const { PrismaClient } = await import("@prisma/client");
  const tdb = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
  try {
    const row = await tdb.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT "${field}" AS val FROM "commerceos_test"."${m.table}" ORDER BY "createdAt" ASC LIMIT 1`,
    );
    const val = row[0]?.val;
    if (typeof val !== "string") return null;
    segs[dynIdx] = encodeURIComponent(val);
    return "/" + segs.join("/");
  } catch {
    return null;
  } finally {
    await tdb.$disconnect();
  }
}
