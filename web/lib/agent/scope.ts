/**
 * Agent dosya erişim politikası — iki katmanlı:
 *
 *  1) HARD GUARD (her zaman): .env, prisma, auth, db.ts, middleware → asla yazılamaz.
 *  2) USER SCOPE: kullanıcının seçtiği scope'ların writeGlobs path'lerine yazılabilir.
 *
 * Hard guard, scope seçimi ne olursa olsun geçerlidir.
 * Eğer scope kümesi boşsa → hiçbir yere yazma yok.
 *
 * Okuma → genel (test/migration dahil hepsi okunabilir, ama .env yok).
 */

import type { AgentScope } from "./scopes";
import { pathInScopes } from "./scopes";

const FORBIDDEN_READ: RegExp[] = [
  /(^|\/)\.env(\.|$)/, // .env, .env.local, .env.production
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)\.git\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
];

const HARD_FORBIDDEN_WRITE: RegExp[] = [
  ...FORBIDDEN_READ,
  /^web\/prisma\//,
  /^web\/middleware\.ts$/,
  /^web\/auth(\.config)?\.ts$/,
  /^web\/lib\/db\.ts$/,
  /^web\/lib\/auth\//,
  /^web\/lib\/agent\//, // agent kendi kendini değiştiremesin
  /^docker-compose\.yml$/,
  /^web\/package(-lock)?\.json$/,
  /^web\/pnpm-lock\.yaml$/,
  /^web\/next\.config\./,
  /^web\/tsconfig\.json$/,
  /^web\/scripts\//,
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

export function canWrite(
  path: string,
  scopes: AgentScope[],
): { ok: boolean; reason?: string } {
  const p = pathOf(path);
  if (p.includes("..")) return { ok: false, reason: "path traversal yasak" };

  // 1) Hard guard
  for (const r of HARD_FORBIDDEN_WRITE) {
    if (r.test(p)) return { ok: false, reason: `kritik sistem dosyası — yazılamaz` };
  }

  // 2) Scope kuralı
  if (scopes.length === 0) {
    return { ok: false, reason: "hiç scope seçilmemiş" };
  }
  if (!pathInScopes(p, scopes)) {
    return {
      ok: false,
      reason: `bu yol seçili scope dışı (seçilen: ${scopes.map((s) => s.label).join(", ")})`,
    };
  }
  return { ok: true };
}

export function scopeSummary(scopes: AgentScope[]): string {
  if (scopes.length === 0) {
    return "Hiç scope seçilmedi — hiçbir dosyaya yazamazsın.";
  }
  return [
    "✓ Sadece şu scope'lardaki dosyalara yazabilirsin:",
    ...scopes.map((s) => `   • ${s.label}`),
    "✗ Prisma, auth, db.ts, .env, middleware, package.json her zaman yasak.",
    "✓ Repo'daki her dosya OKUNABİLİR (.env hariç) — keşif için kullan.",
  ].join("\n");
}
