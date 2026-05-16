import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB her dosya
const MAX_FILES = 4;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Style = "studio" | "lifestyle" | "minimal" | "dark";

/**
 * Kullanıcının yüklediği fotoğrafları al, AI service /images/improve'a base64
 * olarak yolla, dönen görselleri /uploads/ altına kaydet, URL'leri döndür.
 *
 * FormData fields:
 *   files: File[]  (1-4 görsel, image/*)
 *   style: Style
 *   count: 1-4
 *   extra_hint?: string
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
    }

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const style = (form.get("style") as Style) || "studio";
    const count = Math.min(4, Math.max(1, Number(form.get("count") ?? 2)));
    const extraHint = (form.get("extra_hint") as string | null)?.toString().trim() || null;

    if (files.length === 0) {
      return Response.json(
        { ok: false, error: "En az 1 fotoğraf yükle." },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES) {
      return Response.json(
        { ok: false, error: `Max ${MAX_FILES} fotoğraf yüklenebilir.` },
        { status: 400 },
      );
    }
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        return Response.json(
          { ok: false, error: `Yalnız görsel: ${f.name} tipi geçersiz (${f.type}).` },
          { status: 400 },
        );
      }
      if (f.size > MAX_FILE_BYTES) {
        return Response.json(
          { ok: false, error: `${f.name} çok büyük (max 8MB).` },
          { status: 400 },
        );
      }
    }

    // Base64 dönüştür
    const sourceImagesB64: string[] = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      sourceImagesB64.push(buf.toString("base64"));
    }

    // AI service'e yolla
    let upstream: Response;
    try {
      upstream = await fetch(`${AI_BASE}/images/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_images_b64: sourceImagesB64,
          style,
          count,
          extra_hint: extraHint,
        }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `AI servisine bağlanılamadı: ${msg.slice(0, 200)}` },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      const friendly =
        upstream.status === 422
          ? "AI fotoğrafı analiz edemedi ya da güvenlik filtresi engelledi. Daha net bir ürün fotoğrafı dene."
          : `AI servisi hatası (${upstream.status}): ${detail.slice(0, 200)}`;
      return Response.json({ ok: false, error: friendly }, { status: 502 });
    }

    let data: { images_b64: string[]; prompt: string; analyzed_description: string };
    try {
      data = (await upstream.json()) as typeof data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `AI yanıtı okunamadı: ${msg.slice(0, 200)}` },
        { status: 502 },
      );
    }

    // PNG'leri kaydet
    const urls: string[] = [];
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      for (const b64 of data.images_b64) {
        const buf = Buffer.from(b64, "base64");
        const filename = `ai-imp-${Date.now()}-${randomBytes(4).toString("hex")}.png`;
        await writeFile(path.join(UPLOAD_DIR, filename), buf);
        urls.push(`/uploads/${filename}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `Görsel diske yazılamadı: ${msg.slice(0, 200)}` },
        { status: 500 },
      );
    }

    return Response.json(
      {
        ok: true,
        urls,
        prompt: data.prompt,
        analyzed: data.analyzed_description,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error: `Beklenmeyen hata: ${msg.slice(0, 200)}` },
      { status: 500 },
    );
  }
}
