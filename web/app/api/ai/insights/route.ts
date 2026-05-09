import { auth } from "@/auth";
import { buildInsightsPayload } from "@/lib/queries/insights";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(180, Math.max(7, Number(url.searchParams.get("days")) || 30));

  const payload = await buildInsightsPayload(days);

  const upstream = await fetch(`${AI_BASE}/insights/sales/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("AI servisine erişilemedi", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
