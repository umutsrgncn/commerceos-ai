"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Anomaly = {
  metric: string;
  severity: "high" | "medium" | "low";
  title: string;
  explanation: string;
  action: string;
  current: string | null;
  baseline: string | null;
  change_pct: number | null;
};

type ScanResult = {
  anomalies: Anomaly[];
  summary: string;
  candidates_evaluated: number;
};

const STORAGE_KEY = "commerceos:anomaly-dismissed-v1";
const CACHE_KEY = "commerceos:anomaly-cache-v1";
const EXPANDED_KEY = "commerceos:anomaly-expanded-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

type CachedScan = { ts: number; data: ScanResult };

export function AnomalyBanner() {
  const [pending, setPending] = useState(false);
  const [data, setData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const dis = localStorage.getItem(STORAGE_KEY);
      if (dis) setDismissed(new Set(JSON.parse(dis)));

      const exp = localStorage.getItem(EXPANDED_KEY);
      if (exp === "1") setExpanded(true);

      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedScan = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL_MS) {
          setData(parsed.data);
          setCachedAt(parsed.ts);
          return;
        }
      }
      scan();
    } catch {
      scan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistDismissed(next: Set<string>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {}
  }

  function persistCache(scanData: ScanResult) {
    try {
      const payload: CachedScan = { ts: Date.now(), data: scanData };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      setCachedAt(payload.ts);
    } catch {}
  }

  function toggle() {
    setExpanded((v) => {
      const next = !v;
      try {
        localStorage.setItem(EXPANDED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  function dismiss(metric: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(metric);
      persistDismissed(next);
      return next;
    });
  }

  async function scan() {
    setPending(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/anomaly-scan", { method: "POST" });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        setError(t || `Hata ${r.status}`);
        return;
      }
      const json = (await r.json()) as ScanResult;
      setData(json);
      persistCache(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  const visible = data?.anomalies.filter((a) => !dismissed.has(a.metric)) ?? [];
  const allClear = data && visible.length === 0;
  const highCount = visible.filter((a) => a.severity === "high").length;

  // Loading durumu — kompakt pill
  if (pending && !data) {
    return (
      <Pill
        tone="muted"
        icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
        text="AI son 7 günü tarıyor…"
      />
    );
  }

  if (error) {
    return (
      <Pill
        tone="warning"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        text={`AI taraması başarısız: ${error}`}
        action={
          <Button size="sm" variant="ghost" onClick={scan}>
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrar dene
          </Button>
        }
      />
    );
  }

  if (allClear) {
    return (
      <Pill
        tone="success"
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        text="Anormallik yok — son 7 gün önceki 4 hafta ile uyumlu."
        meta={cachedAt ? formatCacheAge(cachedAt) : undefined}
        action={
          <button
            type="button"
            onClick={scan}
            disabled={pending}
            className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
            aria-label="Yenile"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
          </button>
        }
      />
    );
  }

  if (!data) return null;

  // Anormallik VAR — kompakt collapsed başlık + expand edilince detay
  return (
    <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.02]">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            AI Proaktif Uyarılar
            <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-fuchsia-700 dark:text-fuchsia-400">
              {visible.length}
            </span>
            {highCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600">
                <ShieldAlert className="h-2.5 w-2.5" />
                {highCount} kritik
              </span>
            )}
          </div>
          {!expanded && (
            <p className="mt-0.5 truncate text-xs text-[color:var(--color-muted)]">
              {data.summary || `${visible.length} anormallik tespit edildi`}
              {cachedAt && ` · ${formatCacheAge(cachedAt)}`}
            </p>
          )}
        </div>
        <span
          className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
          aria-label="Yenile"
          onClick={(e) => {
            e.stopPropagation();
            scan();
          }}
          role="button"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[color:var(--color-muted)] transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-fuchsia-500/15 p-3 space-y-2">
          {visible.map((a) => (
            <AnomalyRow
              key={a.metric}
              anomaly={a}
              onDismiss={() => dismiss(a.metric)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({
  tone,
  icon,
  text,
  meta,
  action,
}: {
  tone: "muted" | "success" | "warning";
  icon: React.ReactNode;
  text: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-700 dark:text-emerald-400"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/[0.04] text-amber-700 dark:text-amber-400"
        : "border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.03] text-[color:var(--color-muted)]";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        toneClass,
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 min-w-0 truncate">{text}</span>
      {meta && (
        <span className="shrink-0 text-[10px] opacity-70">{meta}</span>
      )}
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}

function AnomalyRow({
  anomaly,
  onDismiss,
}: {
  anomaly: Anomaly;
  onDismiss: () => void;
}) {
  const tone =
    anomaly.severity === "high"
      ? "border-red-500/30 bg-red-500/[0.05]"
      : anomaly.severity === "medium"
        ? "border-amber-500/25 bg-amber-500/[0.04]"
        : "border-indigo-500/25 bg-indigo-500/[0.03]";
  const iconColor =
    anomaly.severity === "high"
      ? "text-red-500"
      : anomaly.severity === "medium"
        ? "text-amber-600"
        : "text-indigo-500";

  const change = anomaly.change_pct;
  const sign = change != null && change > 0 ? "+" : "";

  return (
    <div className={cn("relative rounded-md border p-2.5 text-sm", tone)}>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]"
        title="Yoksay"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2 pr-5">
        <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium leading-tight">
              {anomaly.title}
            </span>
            {change != null && (
              <span className="rounded-full bg-[color:var(--color-fg)]/[0.06] px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                {sign}
                {change}%
              </span>
            )}
            {anomaly.current && (
              <span className="text-[10px] text-[color:var(--color-muted)]">
                {anomaly.current} (baseline {anomaly.baseline})
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-[color:var(--color-muted)]">
            {anomaly.explanation}
          </p>
          {anomaly.action && (
            <p className="text-xs">
              <span className="font-medium">Aksiyon:</span> {anomaly.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCacheAge(ts: number): string {
  const age = Date.now() - ts;
  if (age < 60_000) return "şimdi tarandı";
  if (age < 3600_000) return `${Math.floor(age / 60_000)} dk önce`;
  return `${Math.floor(age / 3600_000)} saat önce`;
}
