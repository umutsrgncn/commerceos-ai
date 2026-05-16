import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * Public export signature snapshot — function/const adı + parametre listesi
 * (+ return type ipucu) yakalar. Agent task başında snapshot alınır, finish
 * öncesi yeniden hesaplanır, fark varsa reject edilir.
 *
 * Sebep: agent yanlışlıkla public bir fonksiyonun signature'ını/return
 * type'ını değiştirebilir; TSC tüketici tarafı `any` ile çalıştığı için bunu
 * yakalayamaz, runtime'da patlar (ör. listActivity(limit) → listActivity(
 * page, pageSize), array → {items,total} dönüşüm).
 *
 * Çözüm: regex-tabanlı signature snapshot. Sınırlı doğruluk ama %95 yakalar.
 */

export type SignatureMap = Map<string, string>; // "relpath:fnName" → "signature"

/** export function X(...): Y { ... } */
const FN_RE = /export\s+(?:async\s+)?function\s+(\w+)\s*(\([^)]*\))(?:\s*:\s*([^{]+?))?\s*\{/g;
/** export const X = (...) => Y veya = async (...) => Y */
const CONST_ARROW_RE = /export\s+const\s+(\w+)\s*(?::\s*[^=]+)?=\s*(?:async\s+)?(\([^)]*\))(?:\s*:\s*([^{=]+?))?\s*=>/g;
/** export type X = ... / export interface X { ... } */
const TYPE_RE = /export\s+(?:type|interface)\s+(\w+)\b/g;

/**
 * Dosyadan public export signature'larını çıkar.
 * Returns: Map<"fnName" → "(params)[: returnType]">
 */
function extractSignatures(content: string): Map<string, string> {
  const map = new Map<string, string>();
  // Yorumları temizle (basit, multi-line yorumları yutma riski var ama yeterli)
  const cleaned = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  let m: RegExpExecArray | null;
  while ((m = FN_RE.exec(cleaned)) !== null) {
    const sig = `${m[2]}${m[3] ? `:${m[3].trim()}` : ""}`;
    map.set(m[1], normalize(sig));
  }
  FN_RE.lastIndex = 0;

  while ((m = CONST_ARROW_RE.exec(cleaned)) !== null) {
    const sig = `${m[2]}${m[3] ? `:${m[3].trim()}` : ""}`;
    map.set(m[1], normalize(sig));
  }
  CONST_ARROW_RE.lastIndex = 0;

  while ((m = TYPE_RE.exec(cleaned)) !== null) {
    // Type/interface — sadece adın var olduğunu say
    if (!map.has(m[1])) map.set(m[1], "[type]");
  }
  TYPE_RE.lastIndex = 0;

  return map;
}

/** Whitespace + trailing pattern normalize ki minor farklar tetiklemesin */
function normalize(sig: string): string {
  return sig.replace(/\s+/g, " ").replace(/\s*,\s*/g, ",").trim();
}

/**
 * Bir scope dosyasındaki public export'ları al.
 * webPath: worktree'nin web/ klasörü.
 * relPath: web/ relative path (örn. "lib/queries/activity.ts").
 */
export async function captureFileSignatures(
  webPath: string,
  relPath: string,
): Promise<Map<string, string>> {
  const full = path.join(webPath, relPath);
  try {
    const content = await fs.readFile(full, "utf8");
    return extractSignatures(content);
  } catch {
    return new Map();
  }
}

/**
 * Task başında — agent'ın yazma yetkisinde olan TÜM lib/queries/*, lib/shop/*,
 * ve scope writeGlobs'larındaki dosyaların signature'larını snapshot al.
 *
 * Pratik yaklaşım: git ls-files ile worktree'deki tüm .ts dosyalarını al,
 * SADECE non-component dosyaları (queries, actions, helpers) tara. UI
 * page.tsx'leri export contract'a sahip değil (default export'lu component'ler).
 */
export async function captureSnapshot(webPath: string): Promise<SignatureMap> {
  const result: SignatureMap = new Map();
  try {
    const { stdout } = await exec("git", ["ls-files"], {
      cwd: webPath,
      maxBuffer: 1024 * 1024 * 4,
    });
    const files = stdout.split("\n").filter((f) => {
      if (!f) return false;
      if (!f.endsWith(".ts") && !f.endsWith(".tsx")) return false;
      // Sadece "public API" denilebilecek dosyalar
      return (
        f.startsWith("lib/queries/") ||
        f.startsWith("lib/actions/") ||
        f.startsWith("lib/shop/") ||
        f.startsWith("lib/utils/") ||
        f.startsWith("lib/helpers/")
      );
    });
    for (const f of files) {
      const sigs = await captureFileSignatures(webPath, f);
      for (const [name, sig] of sigs) {
        result.set(`${f}:${name}`, sig);
      }
    }
  } catch {
    // Snapshot alınamadıysa boş set — gate effective degil ama çakılma yok
  }
  return result;
}

export type SignatureDiff =
  | { ok: true }
  | { ok: false; broken: string[] };

/**
 * Snapshot'la mevcut signature'ları karşılaştır.
 * Değişen / silinen / yeniden adlandırılan public export'ları bul.
 * (Yeni eklenen export sorun değil — geriye uyumlu.)
 */
export async function checkSignatureChanges(
  webPath: string,
  baseline: SignatureMap,
): Promise<SignatureDiff> {
  const current = await captureSnapshot(webPath);
  const broken: string[] = [];
  for (const [key, oldSig] of baseline) {
    const newSig = current.get(key);
    if (newSig === undefined) {
      broken.push(`SİLİNDİ: ${key} (eski signature: ${oldSig.slice(0, 100)})`);
    } else if (newSig !== oldSig) {
      broken.push(
        `DEĞİŞTİ: ${key}\n  eski: ${oldSig.slice(0, 80)}\n  yeni: ${newSig.slice(0, 80)}`,
      );
    }
  }
  if (broken.length === 0) return { ok: true };
  return { ok: false, broken };
}
