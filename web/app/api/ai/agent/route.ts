import { auth } from "@/auth";
import type { ChatRequestPayload } from "@/types/chat";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await req.json()) as Partial<ChatRequestPayload>;
  if (!payload?.messages?.length) {
    return new Response("messages alanı boş olamaz", { status: 400 });
  }

  const upstream = await fetch(`${AI_BASE}/chat/agent/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: payload.messages }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("AI servisine erişilemedi", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
