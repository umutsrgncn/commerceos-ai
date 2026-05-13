import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FunctionDeclaration, SchemaType } from "@google/generative-ai";

import { canRead, canWrite } from "./scope";
import type { AgentScope } from "./scopes";

const exec = promisify(execFile);

/** Bir dosyanın task içinde okunduğunu kanıtlayan snapshot */
type ReadSnapshot = {
  mtimeMs: number;
  /** Tam dosya içeriği. Truncated read'lerde isFullRead=false → edit yasak. */
  content: string;
  isFullRead: boolean;
  readAt: number; // task içi seq (kaçıncı tool call)
};

export type AgentContext = {
  taskId: string;
  worktreePath: string;
  scopes: AgentScope[];
  emit: (
    type:
      | "TOOL_CALL"
      | "TOOL_RESULT"
      | "FILE_WRITE"
      | "ERROR"
      | "NOTE"
      | "THINK"
      | "COMMIT",
    summary: string,
    payload?: Record<string, unknown>,
  ) => Promise<void>;
  /** Okunan dosya snapshot'ları — edit öncesi doğrulama için */
  readFiles: Map<string, ReadSnapshot>;
  /** Edit denemelerinin hash'i — semantic dedup */
  editAttempts: Map<string, number>;
  /** Tool call sayacı (state takibi) */
  callCounter: { n: number };
};

export function makeReadFilesMap(): Map<string, ReadSnapshot> {
  return new Map();
}

const MAX_READ_BYTES = 30_000;
const MAX_GREP_HITS = 60;

// ─── Schemas (function declarations) ───

export const TOOL_DECLS: FunctionDeclaration[] = [
  {
    name: "list_dir",
    description:
      "Bir klasördeki dosya ve alt klasörleri listele. Path repo kökünden relatif.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        path: { type: "STRING" as SchemaType, description: "Repo kökünden relatif klasör yolu" },
      },
      required: ["path"],
    },
  },
  {
    name: "read_file",
    description:
      "Bir dosyanın tüm içeriğini oku. Aynı dosya zaten okunduysa ve içerik değişmediyse 'değişmedi' özeti döner — tekrar okumana gerek yok. Max 30KB; daha büyükse truncated döner. ÖNEMLİ: edit_file çağırmadan ÖNCE mutlaka read_file çağırmalısın.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        path: { type: "STRING" as SchemaType, description: "Repo kökünden relatif dosya yolu" },
      },
      required: ["path"],
    },
  },
  {
    name: "grep",
    description:
      "Repoda regex ile metin ara. Sonuçları file:line:text formatında döner. Max 60 satır.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        pattern: { type: "STRING" as SchemaType, description: "Regex (egrep uyumlu)" },
        path: {
          type: "STRING" as SchemaType,
          description: "Arama klasörü (opsiyonel, varsayılan tüm repo)",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "write_file",
    description:
      "Bir dosyayı **komple** yaz/üzerine yaz. Scope kilidi var: prisma, auth, db.ts, .env yazılamaz. Mevcut dosyayı üzerine yazmadan ÖNCE read_file çağırmalısın.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        path: { type: "STRING" as SchemaType, description: "Repo kökünden relatif dosya yolu" },
        content: { type: "STRING" as SchemaType, description: "Dosyanın tam yeni içeriği" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit_file",
    description:
      "Bir dosyada tek bir string'i başka bir string ile değiştir. KURALLAR:\n" +
      "1) Bu dosyayı önce read_file ile okumuş olmalısın — yoksa hata.\n" +
      "2) old_string dosyada UNIQUE olmalı. Birden çok yerde geçiyorsa: ya daha fazla bağlam ekle ya da replace_all=true ver.\n" +
      "3) Aynı (path, old_string, new_string) edit'ini 2 kez deneme — DRY hata.\n" +
      "4) Indentation'ı koru — old_string'deki boşluk/tab'ler new_string'de de aynı olmalı.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        path: { type: "STRING" as SchemaType },
        old_string: { type: "STRING" as SchemaType, description: "Eşleştirilecek tam metin (indentation dahil)" },
        new_string: { type: "STRING" as SchemaType, description: "Yerine yazılacak metin" },
        replace_all: {
          type: "BOOLEAN" as SchemaType,
          description: "true ise tüm eşleşmeleri değiştir (default false — tek eşleşme bekler)",
        },
      },
      required: ["path", "old_string", "new_string"],
    },
  },
  {
    name: "finish",
    description:
      "Tüm değişiklikler tamam, agent görevi bitirdi. Bunu çağırınca loop biter, test aşamasına geçilir.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        summary: {
          type: "STRING" as SchemaType,
          description: "1-2 cümle: ne yapıldığının kullanıcı-dostu özeti",
        },
      },
      required: ["summary"],
    },
  },
];

// ─── Helpers ───

function resolveSafe(ctx: AgentContext, relPath: string): string {
  const norm = relPath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (norm.includes("..")) throw new Error("path traversal yasak");
  return path.join(ctx.worktreePath, norm);
}

function normalizePath(p: string): string {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

function hashEdit(relPath: string, oldStr: string, newStr: string, all: boolean): string {
  return createHash("sha1")
    .update(`${relPath}|${all ? 1 : 0}|${oldStr}|${newStr}`)
    .digest("hex")
    .slice(0, 16);
}

async function getMtime(absPath: string): Promise<number> {
  const st = await fs.stat(absPath);
  return st.mtimeMs;
}

/**
 * Hedef metin bulunamadıysa: dosyada en yakın benzer satır pasajını döner.
 * Whitespace/quote farkını işaret eder ki agent doğru old_string'i oluşturabilsin.
 */
function findClosestSnippet(
  content: string,
  needle: string,
): { line: number; text: string; diffNote: string } | null {
  const needleLines = needle.split("\n");
  const firstNeedleLine = needleLines[0].trim();
  if (firstNeedleLine.length < 5) return null;

  const lines = content.split("\n");
  let bestLine = -1;
  let bestScore = 0;

  // İlk satırın trimmed versiyonuna en yakın eşleşmeyi bul
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === firstNeedleLine) {
      bestLine = i;
      bestScore = 100;
      break;
    }
    // Substring kontrolü
    if (trimmed.length > 0 && firstNeedleLine.includes(trimmed.slice(0, 15))) {
      if (bestScore < 50) {
        bestLine = i;
        bestScore = 50;
      }
    }
    if (firstNeedleLine.includes(trimmed) && trimmed.length > 10) {
      if (bestScore < 70) {
        bestLine = i;
        bestScore = 70;
      }
    }
  }

  if (bestLine === -1) return null;

  // Yakın eşleşmeyi ve fark notu döndür
  const window = lines
    .slice(bestLine, Math.min(bestLine + needleLines.length + 1, lines.length))
    .join("\n");

  let diffNote = "bilinmiyor";
  const actualFirst = lines[bestLine];
  const expectedFirst = needleLines[0];
  if (actualFirst.trim() === expectedFirst.trim() && actualFirst !== expectedFirst) {
    diffNote = "indentation/whitespace farkı (boşluk/tab sayısı eşleşmiyor)";
  } else if (
    actualFirst.replace(/['"`""'']/g, '"') === expectedFirst.replace(/['"`""'']/g, '"')
  ) {
    diffNote = "quote stili farkı (düz \" vs curly “ ” gibi)";
  } else {
    diffNote = "metin biraz farklı — dosyadaki pasajı KOPYALAYIP old_string'e ver";
  }

  return { line: bestLine + 1, text: window.slice(0, 400), diffNote };
}

// ─── Tool implementations ───

export async function execTool(
  ctx: AgentContext,
  name: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; result?: unknown; error?: string; finish?: { summary: string } }> {
  ctx.callCounter.n += 1;
  try {
    switch (name) {
      case "list_dir":
        return { ok: true, result: await listDir(ctx, String(args.path ?? "")) };
      case "read_file":
        return { ok: true, result: await readFile(ctx, String(args.path ?? "")) };
      case "grep":
        return {
          ok: true,
          result: await grep(ctx, String(args.pattern ?? ""), args.path ? String(args.path) : undefined),
        };
      case "write_file":
        return {
          ok: true,
          result: await writeFile(ctx, String(args.path ?? ""), String(args.content ?? "")),
        };
      case "edit_file":
        return {
          ok: true,
          result: await editFile(ctx, {
            path: String(args.path ?? ""),
            old_string: String(args.old_string ?? ""),
            new_string: String(args.new_string ?? ""),
            replace_all: args.replace_all === true,
          }),
        };
      case "finish":
        return { ok: true, finish: { summary: String(args.summary ?? "Tamamlandı.") } };
      default:
        return { ok: false, error: `Bilinmeyen tool: ${name}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function listDir(ctx: AgentContext, relPath: string) {
  if (!canRead(relPath)) throw new Error(`okuma yasak: ${relPath}`);
  const full = resolveSafe(ctx, relPath);
  const entries = await fs.readdir(full, { withFileTypes: true });
  return entries
    .filter((e) => !e.name.startsWith(".") || e.name === ".env.example")
    .map((e) => ({
      name: e.name,
      type: e.isDirectory() ? "dir" : "file",
    }))
    .slice(0, 200);
}

async function readFile(ctx: AgentContext, relPath: string) {
  if (!canRead(relPath)) throw new Error(`okuma yasak: ${relPath}`);
  const norm = normalizePath(relPath);
  const full = resolveSafe(ctx, relPath);

  // Dedup: aynı dosya + mtime değişmediyse stub
  const mtime = await getMtime(full);
  const prev = ctx.readFiles.get(norm);
  if (prev && prev.mtimeMs === mtime) {
    return {
      path: relPath,
      content: `[Bu dosya değişmedi — seq #${prev.readAt}'te okuduğun içerik geçerli. Tekrar okumana gerek yok, mevcut bilgiyle ilerle.]`,
      truncated: false,
      unchanged: true,
    };
  }

  const buf = await fs.readFile(full);
  const isFull = buf.length <= MAX_READ_BYTES;
  const text = isFull ? buf.toString("utf8") : buf.slice(0, MAX_READ_BYTES).toString("utf8");

  // Snapshot kaydı (edit guard için)
  ctx.readFiles.set(norm, {
    mtimeMs: mtime,
    content: text,
    isFullRead: isFull,
    readAt: ctx.callCounter.n,
  });

  if (!isFull) {
    return { path: relPath, content: text, truncated: true, totalBytes: buf.length };
  }
  return { path: relPath, content: text, truncated: false };
}

async function grep(ctx: AgentContext, pattern: string, relPath?: string) {
  const target = relPath ? resolveSafe(ctx, relPath) : ctx.worktreePath;
  try {
    const { stdout } = await exec(
      "grep",
      [
        "-rn",
        "-E",
        "--max-count=80",
        "--exclude-dir=node_modules",
        "--exclude-dir=.next",
        "--exclude-dir=.git",
        "--exclude-dir=test-results",
        "--exclude-dir=playwright-report",
        pattern,
        target,
      ],
      { maxBuffer: 1024 * 1024, timeout: 15_000 },
    );
    const rootPrefix = ctx.worktreePath + path.sep;
    const lines = stdout
      .split("\n")
      .filter(Boolean)
      .slice(0, MAX_GREP_HITS)
      .map((ln) => (ln.startsWith(rootPrefix) ? ln.slice(rootPrefix.length) : ln));
    return { pattern, hits: lines.length, lines };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 1) {
      return { pattern, hits: 0, lines: [] };
    }
    throw err;
  }
}

async function writeFile(ctx: AgentContext, relPath: string, content: string) {
  const check = canWrite(relPath, ctx.scopes);
  if (!check.ok) {
    await ctx.emit("ERROR", `Yazma reddedildi: ${relPath}`, { reason: check.reason });
    throw new Error(`yazma yasak: ${check.reason}`);
  }
  const norm = normalizePath(relPath);
  const full = resolveSafe(ctx, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const exists = await fs
    .stat(full)
    .then(() => true)
    .catch(() => false);

  // ÜZERİNE yazma değil, mevcut dosya varsa read-before-write guard
  // (sıfırdan dosya oluşturma her zaman OK)
  if (exists && !ctx.readFiles.has(norm)) {
    throw new Error(
      "Mevcut bir dosyayı write_file ile üzerine yazmadan ÖNCE read_file ile okumalısın. Bu, içeriği yanlışlıkla kaybetmeni engeller.",
    );
  }

  await fs.writeFile(full, content, "utf8");

  // Post-write: duplicate detector
  const dupWarning = detectDuplicateLines(content);
  if (dupWarning) {
    await ctx.emit("NOTE", `Uyarı: ${relPath}'te ${dupWarning}`, { warning: dupWarning });
  }

  // Post-write: snapshot güncelle (edit guard için)
  const mtime = await getMtime(full);
  ctx.readFiles.set(norm, {
    mtimeMs: mtime,
    content,
    isFullRead: true,
    readAt: ctx.callCounter.n,
  });

  await ctx.emit("FILE_WRITE", `${exists ? "Güncellendi" : "Oluşturuldu"}: ${relPath}`, {
    path: relPath,
    bytes: Buffer.byteLength(content, "utf8"),
    created: !exists,
  });
  return {
    path: relPath,
    bytes: Buffer.byteLength(content, "utf8"),
    created: !exists,
    ...(dupWarning ? { warning: dupWarning } : {}),
  };
}

async function editFile(
  ctx: AgentContext,
  args: { path: string; old_string: string; new_string: string; replace_all: boolean },
) {
  const { path: relPath, old_string: oldStr, new_string: newStr, replace_all: replaceAll } = args;

  // Scope check
  const check = canWrite(relPath, ctx.scopes);
  if (!check.ok) {
    await ctx.emit("ERROR", `Edit reddedildi: ${relPath}`, { reason: check.reason });
    throw new Error(`yazma yasak: ${check.reason}`);
  }
  if (!oldStr) throw new Error("old_string boş olamaz");
  if (oldStr === newStr) throw new Error("old_string ve new_string aynı");

  const norm = normalizePath(relPath);
  const full = resolveSafe(ctx, relPath);

  // 1) Read-before-edit guard
  const snapshot = ctx.readFiles.get(norm);
  if (!snapshot) {
    throw new Error(
      `Bu dosyayı önce read_file ile okumalısın: ${relPath}. Edit hayalet referansla yapılamaz.`,
    );
  }
  if (!snapshot.isFullRead) {
    throw new Error(
      `${relPath} truncated okunmuştu (dosya çok büyük). Edit için tam içerik gerekli — bu dosyayı şu an edit edemezsin.`,
    );
  }

  // 2) Stale check — dosya başka biri tarafından değiştirildi mi?
  const currentMtime = await getMtime(full);
  if (currentMtime !== snapshot.mtimeMs) {
    // Worktree'de hiç değişiklik olmamalı (sadece agent yazıyor), yine de defansif
    throw new Error(
      `${relPath} son read'inden sonra değişmiş (mtime mismatch). Önce yeniden read_file çağır.`,
    );
  }

  // 3) Semantic dedup — aynı edit'i 2. kez deneme
  const editHash = hashEdit(norm, oldStr, newStr, replaceAll);
  const prevAttempts = ctx.editAttempts.get(editHash) ?? 0;
  if (prevAttempts > 0) {
    throw new Error(
      `Bu edit (${relPath}, aynı old/new) zaten yapıldı veya denendi. Tekrar etme — farklı bir değişiklik gerekiyorsa farklı argümanlar kullan.`,
    );
  }
  ctx.editAttempts.set(editHash, 1);

  // 4) Match analizi
  const content = await fs.readFile(full, "utf8");
  let occurrences = 0;
  let idx = -1;
  while ((idx = content.indexOf(oldStr, idx + 1)) !== -1) occurrences += 1;

  if (occurrences === 0) {
    // Yakın eşleşme bulmaya çalış — agent'a "şuna mı dedin?" ipucu
    const hint = findClosestSnippet(content, oldStr);
    const hintMsg = hint
      ? `\n\nDosyada en yakın benzer pasaj (satır ${hint.line}):\n${hint.text}\n\nFark muhtemelen: ${hint.diffNote}`
      : "";
    throw new Error(
      `old_string ${relPath} dosyasında bulunamadı (tam eşleşme, whitespace ve quote tipleri dahil).${hintMsg}`,
    );
  }
  if (occurrences > 1 && !replaceAll) {
    throw new Error(
      `old_string ${occurrences} farklı yerde geçiyor. Çözüm: ya replace_all=true ver (hepsini değiştir), ya da old_string'e daha fazla bağlam ekleyip UNIQUE yap.`,
    );
  }

  // 5) Değiştir
  const next = replaceAll
    ? content.split(oldStr).join(newStr)
    : content.replace(oldStr, newStr);
  await fs.writeFile(full, next, "utf8");

  // 6) Post-edit: duplicate import / line check
  const dupWarning = detectDuplicateLines(next);
  if (dupWarning) {
    await ctx.emit("NOTE", `Uyarı: ${relPath}'te ${dupWarning}`, { warning: dupWarning });
  }

  // 7) Post-edit: snapshot güncelle
  const newMtime = await getMtime(full);
  ctx.readFiles.set(norm, {
    mtimeMs: newMtime,
    content: next,
    isFullRead: true,
    readAt: ctx.callCounter.n,
  });

  await ctx.emit("FILE_WRITE", `Edit: ${relPath}${replaceAll ? ` (${occurrences} yer)` : ""}`, {
    path: relPath,
    oldBytes: Buffer.byteLength(oldStr, "utf8"),
    newBytes: Buffer.byteLength(newStr, "utf8"),
    replacements: replaceAll ? occurrences : 1,
  });
  return {
    path: relPath,
    replaced: replaceAll ? occurrences : 1,
    ...(dupWarning ? { warning: dupWarning } : {}),
  };
}

/**
 * Edit sonrası ortaya çıkan en sık hata: agent aynı satırı (özellikle import)
 * iki kez ekler. Yakalayıp uyarı döner — agent bir sonraki iter'de düzeltir.
 */
function detectDuplicateLines(content: string): string | null {
  const lines = content.split("\n");
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  for (const ln of lines) {
    const t = ln.trim();
    // İlginç olan satırlar: import, type, export
    if (!t.startsWith("import ") && !t.startsWith("export ") && !t.startsWith("type ")) continue;
    if (t.length < 8) continue;
    const count = (seen.get(t) ?? 0) + 1;
    seen.set(t, count);
    if (count === 2 && !duplicates.includes(t)) duplicates.push(t);
  }
  if (duplicates.length === 0) return null;
  return `${duplicates.length} duplicate satır var (büyük olasılıkla TypeScript Identifier hatası verir): ${duplicates
    .slice(0, 3)
    .map((d) => `"${d.slice(0, 80)}"`)
    .join(", ")}. Birini sil veya edit'ini geri al.`;
}
