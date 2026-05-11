import { NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const upstream = await fetch(`${AI_BASE}/finance/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const t = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `AI servisi ${upstream.status}: ${t.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
