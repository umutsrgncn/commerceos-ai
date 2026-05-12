/**
 * Agent dosya erişim politikası.
 *
 * Repo kökünden RELATIF path beklenir (örn. "web/app/shop/page.tsx").
 *
 * Okuma → daha geniş (test/migration dahil hepsi okunabilir, ama .env yok).
 * Yazma → çok daha dar (sadece UI dosyaları; prisma/auth/db/middleware yasak).
 */

const FORBIDDEN_READ: RegExp[] = [
  /(^|\/)\.env(\.|$)/, // .env, .env.local, .env.production
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)\.git\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
];

const FORBIDDEN_WRITE: RegExp[] = [
  ...FORBIDDEN_READ,
  /^web\/prisma\//,
  /^web\/middleware\.ts$/,
  /^web\/auth(\.config)?\.ts$/,
  /^web\/lib\/db\.ts$/,
  /^web\/lib\/auth\//,
  /^docker-compose\.yml$/,
  /^web\/package(-lock)?\.json$/,
  /^web\/pnpm-lock\.yaml$/,
  /^web\/next\.config\./,
  /^web\/tsconfig\.json$/,
];

const ALLOWED_WRITE: RegExp[] = [
  // Shop tarafı: tüm dosyalar
  /^web\/app\/shop\//,
  /^web\/components\/(shop|brand|ui|landing|aceternity|reactbits|magic)\//,
  /^web\/lib\/shop\//,
  // Admin UI (component & sayfa, lib hariç)
  /^web\/app\/\(admin\)\/admin\/.+\.(tsx|ts|css)$/,
  /^web\/components\/(dashboard|layout)\/.+\.(tsx|ts|css)$/,
  // Diğer izin verilenler (hero/landing kısımları)
  /^web\/app\/page\.tsx$/,
  /^web\/app\/globals\.css$/,
  /^web\/app\/layout\.tsx$/,
  // Public, types
  /^web\/types\//,
  /^web\/lib\/(format|cn|theme|nav)\.ts$/,
];

function pathOf(p: string) {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function canRead(path: string): boolean {
  const p = pathOf(path);
  if (p.includes("..")) return false; // traversal
  for (const r of FORBIDDEN_READ) if (r.test(p)) return false;
  return true;
}

export function canWrite(path: string): { ok: boolean; reason?: string } {
  const p = pathOf(path);
  if (p.includes("..")) return { ok: false, reason: "path traversal yasak" };
  for (const r of FORBIDDEN_WRITE) {
    if (r.test(p)) return { ok: false, reason: `yasaklı: ${r.source}` };
  }
  for (const r of ALLOWED_WRITE) {
    if (r.test(p)) return { ok: true };
  }
  return {
    ok: false,
    reason: "scope dışı (web/app/shop, components/shop, admin UI yazılabilir)",
  };
}

export function scopeSummary(): string {
  return [
    "✓ shop ve admin UI dosyaları yazılabilir",
    "✗ prisma/, middleware, auth, db.ts, .env, package.json yazılamaz",
    "✓ Repo'daki her dosya okunabilir (.env hariç)",
  ].join("\n");
}
