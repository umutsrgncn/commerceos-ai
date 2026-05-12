import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FunctionDeclaration, SchemaType } from "@google/generative-ai";

import { canRead, canWrite } from "./scope";

const exec = promisify(execFile);

export type AgentContext = {
  taskId: string;
  worktreePath: string;
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
};

const MAX_READ_BYTES = 80_000;
const MAX_GREP_HITS = 80;

// ─── Schemas (Gemini function declarations) ───

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
      "Bir dosyanın tüm içeriğini oku. .env dışında her dosya okunabilir. Max 80KB.",
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
      "Repoda regex ile metin ara. Sonuçları file:line:text formatında döner. Max 80 satır.",
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
      "Bir dosyayı **komple** yaz/üzerine yaz. Scope kilidi var: prisma, auth, db.ts, .env yazılamaz.",
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
      "Bir dosyada tek bir tam string'i başka bir string ile değiştir. old_string dosyada UNIQUE olmalı, yoksa hata.",
    parameters: {
      type: "OBJECT" as SchemaType,
      properties: {
        path: { type: "STRING" as SchemaType },
        old_string: { type: "STRING" as SchemaType, description: "Eşleştirilecek tam metin" },
        new_string: { type: "STRING" as SchemaType, description: "Yerine yazılacak metin" },
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

// ─── Tool implementations ───

export async function execTool(
  ctx: AgentContext,
  name: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; result?: unknown; error?: string; finish?: { summary: string } }> {
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
          result: await editFile(
            ctx,
            String(args.path ?? ""),
            String(args.old_string ?? ""),
            String(args.new_string ?? ""),
          ),
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
  const full = resolveSafe(ctx, relPath);
  const buf = await fs.readFile(full);
  if (buf.length > MAX_READ_BYTES) {
    const text = buf.slice(0, MAX_READ_BYTES).toString("utf8");
    return { path: relPath, content: text, truncated: true, totalBytes: buf.length };
  }
  return { path: relPath, content: buf.toString("utf8"), truncated: false };
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
    // grep exit 1 = no match
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 1) {
      return { pattern, hits: 0, lines: [] };
    }
    throw err;
  }
}

async function writeFile(ctx: AgentContext, relPath: string, content: string) {
  const check = canWrite(relPath);
  if (!check.ok) {
    await ctx.emit("ERROR", `Yazma reddedildi: ${relPath}`, { reason: check.reason });
    throw new Error(`yazma yasak: ${check.reason}`);
  }
  const full = resolveSafe(ctx, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const exists = await fs
    .stat(full)
    .then(() => true)
    .catch(() => false);
  await fs.writeFile(full, content, "utf8");
  await ctx.emit("FILE_WRITE", `${exists ? "Güncellendi" : "Oluşturuldu"}: ${relPath}`, {
    path: relPath,
    bytes: Buffer.byteLength(content, "utf8"),
    created: !exists,
  });
  return { path: relPath, bytes: Buffer.byteLength(content, "utf8"), created: !exists };
}

async function editFile(
  ctx: AgentContext,
  relPath: string,
  oldStr: string,
  newStr: string,
) {
  const check = canWrite(relPath);
  if (!check.ok) {
    await ctx.emit("ERROR", `Edit reddedildi: ${relPath}`, { reason: check.reason });
    throw new Error(`yazma yasak: ${check.reason}`);
  }
  if (!oldStr) throw new Error("old_string boş olamaz");
  if (oldStr === newStr) throw new Error("old_string ve new_string aynı");

  const full = resolveSafe(ctx, relPath);
  const content = await fs.readFile(full, "utf8");
  const idx = content.indexOf(oldStr);
  if (idx === -1) {
    throw new Error("old_string dosyada bulunamadı (tam eşleşme arıyorum)");
  }
  const lastIdx = content.lastIndexOf(oldStr);
  if (lastIdx !== idx) {
    throw new Error(
      "old_string birden çok yerde geçiyor — daha fazla bağlam ekleyip unique yap",
    );
  }
  const next = content.replace(oldStr, newStr);
  await fs.writeFile(full, next, "utf8");
  await ctx.emit("FILE_WRITE", `Edit: ${relPath}`, {
    path: relPath,
    oldBytes: Buffer.byteLength(oldStr, "utf8"),
    newBytes: Buffer.byteLength(newStr, "utf8"),
  });
  return { path: relPath, replaced: 1 };
}
