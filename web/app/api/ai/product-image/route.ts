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

  if (!body.name?.trim()) {
    return Response.json(
      { ok: false, error: "Ürün adı boş olamaz." },
      { status: 400 }
    );
  }

  // Forward to FastAPI Imagen endpoint
  const upstream = await fetch(`${AI_BASE}/images/product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? null,
      style: body.style ?? "studio",
      count: Math.min(4, Math.max(1, body.count ?? 1)),
      aspect_ratio: body.aspect_ratio ?? "1:1",
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return Response.json(
      { ok: false, error: `Imagen ${upstream.status}: ${detail.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as {
    images_b64: string[];
    prompt: string;
  };

  // Persist returned PNGs to public/uploads/, return URLs the form can append.
  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];
  for (const b64 of data.images_b64) {
    const buf = Buffer.from(b64, "base64");
    const filename = `ai-${Date.now()}-${randomBytes(4).toString("hex")}.png`;
    await writeFile(path.join(UPLOAD_DIR, filename), buf);
    urls.push(`/uploads/${filename}`);
  }

  return Response.json({
    ok: true,
    urls,
    prompt: data.prompt,
  });
}
