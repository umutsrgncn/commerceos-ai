"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Camera,
  CheckCircle2,
  CircleDot,
  FileEdit,
  FlaskConical,
  GitCommit,
  Globe,
  StickyNote,
  Wrench,
} from "lucide-react";
import type { AgentEvent, AgentEventType } from "@prisma/client";

type Ev = Pick<AgentEvent, "id" | "seq" | "type" | "summary" | "payload" | "createdAt">;

const TYPE_META: Record<AgentEventType, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  STATUS: { icon: CircleDot, cls: "text-[color:var(--color-muted)]" },
  THINK: { icon: Brain, cls: "text-indigo-500 dark:text-indigo-300" },
  TOOL_CALL: { icon: Wrench, cls: "text-blue-500 dark:text-blue-300" },
  TOOL_RESULT: { icon: CheckCircle2, cls: "text-emerald-500 dark:text-emerald-300" },
  FILE_WRITE: { icon: FileEdit, cls: "text-violet-500 dark:text-violet-300" },
  TEST_RUN: { icon: FlaskConical, cls: "text-amber-500 dark:text-amber-300" },
  SCREENSHOT: { icon: Camera, cls: "text-cyan-500 dark:text-cyan-300" },
  TUNNEL: { icon: Globe, cls: "text-teal-500 dark:text-teal-300" },
  COMMIT: { icon: GitCommit, cls: "text-fuchsia-500 dark:text-fuchsia-300" },
  ERROR: { icon: AlertTriangle, cls: "text-rose-500 dark:text-rose-300" },
  NOTE: { icon: StickyNote, cls: "text-[color:var(--color-muted)]" },
};

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function EventTimeline({
  taskId,
  initialEvents,
}: {
  taskId: string;
  initialEvents: Ev[];
}) {
  const [events, setEvents] = useState<Ev[]>(initialEvents);
  const [live, setLive] = useState(false);
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const sinceSeq = events[events.length - 1]?.seq ?? 0;
    const url = `/api/agent/${taskId}/stream?since=${sinceSeq}`;
    const es = new EventSource(url);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.addEventListener("event", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as Ev;
        setEvents((prev) => {
          if (prev.some((p) => p.id === data.id)) return prev;
          return [...prev, data];
        });
      } catch {}
    });
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[color:var(--color-bg)]/80 px-2 py-0.5 backdrop-blur">
        <span className={`relative flex h-1.5 w-1.5 ${live ? "" : "opacity-40"}`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${live ? "animate-ping bg-emerald-400 opacity-75" : "bg-[color:var(--color-muted)]"}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-[color:var(--color-muted)]"}`} />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          {live ? "canlı" : "bağlı değil"}
        </span>
      </div>
      <ol
        ref={ref}
        className="themed-scroll max-h-[60vh] overflow-y-auto px-5 py-4"
      >
        {events.length === 0 ? (
          <li className="py-8 text-center text-sm text-[color:var(--color-muted)]">
            Henüz olay yok. Agent başlayınca burada görürsün.
          </li>
        ) : (
          events.map((ev) => {
            const m = TYPE_META[ev.type];
            const Icon = m.icon;
            return (
              <li key={ev.id} className="flex gap-3 py-2.5">
                <div className="flex flex-col items-center">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.04] ${m.cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-1 w-px flex-1 bg-[color:var(--color-border)]" />
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                      {ev.type.toLowerCase().replace("_", " ")}
                    </span>
                    <span className="font-mono text-[10px] text-[color:var(--color-muted)]/60">
                      {fmtTime(ev.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-fg)]/90">
                    {ev.summary}
                  </p>
                  {ev.payload && typeof ev.payload === "object" && (
                    <PayloadHints payload={ev.payload as Record<string, unknown>} />
                  )}
                </div>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    // Nested object → flatten key:value with truncation
    try {
      const entries = Object.entries(v as Record<string, unknown>)
        .slice(0, 3)
        .map(([k, val]) => {
          const s = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `${k}=${s.slice(0, 30)}`;
        });
      return entries.join(" ");
    } catch {
      return JSON.stringify(v).slice(0, 80);
    }
  }
  return String(v).slice(0, 80);
}

function PayloadHints({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload)
    .filter(([k]) => !["content", "diff", "code", "raw"].includes(k))
    .slice(0, 4);
  if (entries.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-muted)]"
        >
          <span className="text-[color:var(--color-fg)]/50">{k}</span>
          <span>{fmtValue(v)}</span>
        </span>
      ))}
    </div>
  );
}
