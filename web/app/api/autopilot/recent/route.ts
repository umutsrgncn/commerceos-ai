import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Otopilot canlı feed — admin layout'taki floating indicator polling'i.
 *
 * Query:
 *   ?since=<isoDate>  — bu tarihten sonraki aksiyonları getir
 *   ?limit=N (max 20) — kaç aksiyon dönsün (default 5)
 *
 * Response:
 *   { enabled: bool, items: [...], serverTime: iso }
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const limitParam = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(20, Number(limitParam) || 5));

  const since = sinceParam ? new Date(sinceParam) : null;

  const settings = await db.systemSettings.findUnique({
    where: { id: "default" },
    select: { autoPilotEnabled: true },
  });

  const items = await db.autoPilotAction.findMany({
    where: since
      ? { createdAt: { gt: since }, status: "EXECUTED" }
      : { status: "EXECUTED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      status: true,
      decision: true,
      reasoning: true,
      confidence: true,
      triggerSummary: true,
      resultRef: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    enabled: settings?.autoPilotEnabled ?? false,
    items,
    serverTime: new Date().toISOString(),
  });
}
