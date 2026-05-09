import { auth } from "@/auth";
import { buildCustomerStats } from "@/lib/queries/customer-stats";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  }

  const body = (await req.json()) as { customerId?: string };
  if (!body.customerId) {
    return Response.json(
      { ok: false, error: "customerId gerekli." },
      { status: 400 }
    );
  }

  const stats = await buildCustomerStats(body.customerId);
  if (!stats) {
    return Response.json(
      { ok: false, error: "Müşteri bulunamadı." },
      { status: 404 }
    );
  }

  const upstream = await fetch(`${AI_BASE}/customers/segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stats }),
  });

  if (!upstream.ok) {
    return Response.json(
      { ok: false, error: `AI servisi ${upstream.status} döndü.` },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  return Response.json({ ok: true, ...data });
}
