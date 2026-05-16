import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  description?: string | null;
  category?: string | null;
  style?: "studio" | "lifestyle" | "minimal" | "dark";
  count?: number;
  aspect_ratio?: "1:1" | "3:4" | "4:3" | "16:9";
};

export async function POST(req: Request) {
  // Tüm gövdeyi try ile sar — herhangi bir adımda throw olursa Next.js'in
  // HTML error page'i yerine JSON döndür ki client `res.json()` parse edebilsin.
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return Response.json({ ok: false, error: "Geçersiz JSON." }, { status: 400 });
    }

    const name = body.name?.trim();
    if (!name) {
      return Response.json(
        { ok: false, error: "Ürün adı boş olamaz." },
        { status: 400 }
      );
    }
    // FastAPI Pydantic min_length=2 → erken yakala
    if (name.length < 2) {
      return Response.json(
        { ok: false, error: "Ürün adı en az 2 karakter olmalı." },
        { status: 400 }
      );
    }

    // Forward to FastAPI Imagen endpoint
    let upstream: Response;
    try {
      upstream = await fetch(`${AI_BASE}/images/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: body.description ?? null,
          category: body.category ?? null,
          style: body.style ?? "studio",
          count: Math.min(4, Math.max(1, body.count ?? 1)),
          aspect_ratio: body.aspect_ratio ?? "1:1",
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `AI servisine bağlanılamadı: ${msg.slice(0, 200)}` },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      // FastAPI 422 → Pydantic validation veya safety filter blokladı
      const friendly =
        upstream.status === 422
          ? "Imagen güvenlik filtresi prompt'u engelledi ya da girilen veri geçersiz. Ürün adını/açıklamayı sadeleştirip tekrar dene."
          : `AI servisi hatası (${upstream.status}): ${detail.slice(0, 200)}`;
      return Response.json({ ok: false, error: friendly }, { status: 502 });
    }

    let data: { images_b64: string[]; prompt: string };
    try {
      data = (await upstream.json()) as { images_b64: string[]; prompt: string };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `AI yanıtı okunamadı: ${msg.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // Persist returned PNGs to public/uploads/, return URLs
    const urls: string[] = [];
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      for (const b64 of data.images_b64) {
        const buf = Buffer.from(b64, "base64");
        const filename = `ai-${Date.now()}-${randomBytes(4).toString("hex")}.png`;
        await writeFile(path.join(UPLOAD_DIR, filename), buf);
        urls.push(`/uploads/${filename}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { ok: false, error: `Görsel diske yazılamadı: ${msg.slice(0, 200)}` },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, urls, prompt: data.prompt });
  } catch (err) {
    // Son savunma — beklenmedik herhangi bir hata JSON olarak dönsün
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error: `Beklenmeyen hata: ${msg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
