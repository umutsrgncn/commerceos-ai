import { NextResponse } from "next/server";
import { listAgentEventsSince } from "@/lib/agent/queries";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 1500;
const MAX_LIFETIME_MS = 5 * 60 * 1000; // 5dk sonra client reconnect etsin

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const sinceParam = Number(url.searchParams.get("since") ?? 0);
  let sinceSeq = Number.isFinite(sinceParam) ? sinceParam : 0;

  // Önce task var mı? — yoksa 404
  const exists = await db.agentTask.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "not found" }, { status: 404 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (payload: string, eventName?: string) => {
        const lines: string[] = [];
        if (eventName) lines.push(`event: ${eventName}`);
        // SSE: multi-line data with `data: ` prefix per line
        for (const ln of payload.split("\n")) lines.push(`data: ${ln}`);
        lines.push("", ""); // event terminator
        try {
          controller.enqueue(enc.encode(lines.join("\n")));
        } catch {
          // controller closed
        }
      };

      const startedAt = Date.now();
      let closed = false;
      let abortHandlerRegistered = false;

      const onAbort = () => {
        closed = true;
        try {
          controller.close();
        } catch {}
      };
      try {
        req.signal.addEventListener("abort", onAbort, { once: true });
        abortHandlerRegistered = true;
      } catch {}

      // Initial hello (so client knows we're alive)
      send(JSON.stringify({ since: sinceSeq, at: new Date().toISOString() }), "hello");

      while (!closed) {
        if (Date.now() - startedAt > MAX_LIFETIME_MS) {
          send(JSON.stringify({ reason: "max_lifetime" }), "close");
          break;
        }
        const events = await listAgentEventsSince(id, sinceSeq);
        for (const ev of events) {
          send(JSON.stringify(ev), "event");
          sinceSeq = ev.seq;
        }

        // Task status değişti mi? Tamamlanan task'lar için early close.
        const status = await db.agentTask.findUnique({
          where: { id },
          select: { status: true },
        });
        if (status && ["MERGED", "REJECTED", "FAILED"].includes(status.status)) {
          send(JSON.stringify({ status: status.status }), "done");
          // Tamamlanmış task'lar için ek poll yapmaya gerek yok
          await sleep(800);
          break;
        }

        // Heartbeat (comment line — SSE client ignore'lar, sadece bağlantıyı canlı tutar)
        controller.enqueue(enc.encode(`: ping ${Date.now()}\n\n`));

        await sleep(POLL_INTERVAL_MS);
      }

      if (abortHandlerRegistered) {
        try {
          req.signal.removeEventListener("abort", onAbort);
        } catch {}
      }
      try {
        controller.close();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
