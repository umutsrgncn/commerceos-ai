import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export type SaveResult =
  | { ok: true; url: string; size: number; mime: string }
  | { ok: false; error: string };

export async function saveUploadedImage(file: File): Promise<SaveResult> {
  if (!ACCEPTED.has(file.type)) {
    return { ok: false, error: `Desteklenmeyen tip: ${file.type}` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Dosya 5MB sınırını aşıyor." };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = EXT[file.type] ?? "bin";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return {
    ok: true,
    url: `/uploads/${filename}`,
    size: file.size,
    mime: file.type,
  };
}
