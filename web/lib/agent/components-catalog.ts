/**
 * web/components/ui/ dizinindeki gerçek export'ları runtime'da tara.
 * Agent halüsinasyon yapıp olmayan Dialog/DialogContent/DialogTrigger gibi
 * shadcn pattern'ini uydurmasın diye briefing'e basılır.
 *
 * Çıktı tek bir markdown bloğu — system prompt'a embed edilir.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const UI_DIR_CANDIDATES = [
  "web/components/ui",
  "components/ui",
];

type ComponentInfo = {
  file: string;          // örn. "modal.tsx"
  exports: string[];     // export'lanan isimler
  propsHint: string;     // ilk Props tipinin satırları (özet)
};

/**
 * Tek bir .tsx dosyasından export listesini ve ilk Props tipinin satırlarını çıkar.
 */
function parseComponentFile(absPath: string): Omit<ComponentInfo, "file"> {
  let src: string;
  try {
    src = readFileSync(absPath, "utf8");
  } catch {
    return { exports: [], propsHint: "" };
  }

  // Export isimleri — basit regex'lerle yakala
  const exports = new Set<string>();
  for (const m of src.matchAll(/export\s+function\s+(\w+)/g)) exports.add(m[1]);
  for (const m of src.matchAll(/export\s+const\s+(\w+)/g)) exports.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class|type|interface|enum)\s+(\w+)/g))
    exports.add(m[1]);
  // `export { Foo, Bar as Baz }` — re-export tipi
  for (const m of src.matchAll(/export\s*\{\s*([^}]+)\s*\}/g)) {
    for (const token of m[1].split(",")) {
      const name = token.trim().split(/\s+as\s+/)[1] ?? token.trim();
      if (/^\w+$/.test(name)) exports.add(name);
    }
  }
  // `export default function Foo` veya `export default Foo`
  for (const m of src.matchAll(/export\s+default\s+(?:function\s+)?(\w+)/g))
    exports.add(`default(${m[1]})`);

  // Props tipini al — `type Props = {...}` veya `type FooProps = {...}` ilk match
  let propsHint = "";
  const propMatch = src.match(/type\s+\w*Props\s*=\s*\{([\s\S]*?)\n\}/);
  if (propMatch) {
    propsHint = propMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//") && !l.startsWith("*"))
      .slice(0, 8)
      .join(" | ");
    if (propsHint.length > 220) propsHint = propsHint.slice(0, 220) + "…";
  }

  return { exports: Array.from(exports), propsHint };
}

let cached: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

/**
 * Worktree-aware tarama — root farklı olabilir.
 * cwd parametresi verilmezse process.cwd() kullanılır.
 */
export function buildComponentsCatalog(cwd: string = process.cwd()): string {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  let fullUiDir: string | null = null;
  let files: string[] = [];
  for (const rel of UI_DIR_CANDIDATES) {
    const candidate = join(cwd, rel);
    try {
      const entries = readdirSync(candidate).filter((f) => f.endsWith(".tsx"));
      if (entries.length > 0) {
        fullUiDir = candidate;
        files = entries;
        break;
      }
    } catch {
      // dene bir sonrakini
    }
  }
  if (!fullUiDir) {
    cached = "(UI components dizini bulunamadı)";
    cachedAt = now;
    return cached;
  }

  const components: ComponentInfo[] = [];
  for (const f of files) {
    const full = join(fullUiDir, f);
    try {
      if (!statSync(full).isFile()) continue;
    } catch {
      continue;
    }
    const info = parseComponentFile(full);
    if (info.exports.length === 0) continue;
    components.push({ file: f, ...info });
  }

  if (components.length === 0) {
    cached = "(UI components bulunamadı)";
    cachedAt = now;
    return cached;
  }

  const lines: string[] = [];
  lines.push("MEVCUT UI BİLEŞENLERİ — bu liste OTORİTEDİR. Burada olmayan komponent UYDURMA:");
  lines.push("");
  for (const c of components) {
    const importPath = `@/components/ui/${c.file.replace(/\.tsx$/, "")}`;
    lines.push(`• ${c.file} → import { ${c.exports.join(", ")} } from "${importPath}";`);
    if (c.propsHint) {
      lines.push(`    props: ${c.propsHint}`);
    }
  }
  lines.push("");
  lines.push("UYARI:");
  lines.push("- Bu listede DialogContent/DialogHeader/DialogTrigger gibi shadcn isimleri YOK.");
  lines.push("- Modal CONTROLLED bir komponenttir (open/onClose props alır), trigger pattern'i değil.");
  lines.push("- Kompozit komponent (Header/Footer/Title alt-bileşenli) gerekiyorsa kendi <h2>/<button>/<div> ile yaz.");

  cached = lines.join("\n");
  cachedAt = now;
  return cached;
}

/**
 * Cache'i el ile bust et (component dosyası değişmişse).
 */
export function invalidateComponentsCatalog() {
  cached = null;
  cachedAt = 0;
}
