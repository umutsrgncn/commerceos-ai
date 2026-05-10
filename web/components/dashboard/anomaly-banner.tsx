"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function AnomalyBanner() {
  const [pending, setPending] = useState(false);
  const [data, setData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Dismiss state localStorage'dan yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function persistDismissed(next: Set<string>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {}
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  // İlk mount'ta otomatik tara
  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = data?.anomalies.filter((a) => !dismissed.has(a.metric)) ?? [];
  const allClear = data && visible.length === 0;

  if (pending && !data) {
    return (
      <Card className="border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/[0.03] to-indigo-500/[0.02]">
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-fuchsia-500" />
          <span className="text-[color:var(--color-muted)]">
            AI son 7 günü inceliyor, anormallik var mı diye bakıyor...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/[0.04]">
        <CardContent className="flex items-center justify-between gap-3 p-4 text-xs">
          <span className="text-amber-700 dark:text-amber-400">
            AI taraması başarısız: {error}
          </span>
          <Button size="sm" variant="ghost" onClick={scan}>
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (allClear) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/[0.03]">
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Anormallik yok — son 7 gün önceki 4 hafta ile uyumlu.</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={scan}
            className="ml-auto"
            disabled={pending}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            Yenile
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              AI Proaktif Uyarılar
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                {visible.length}
              </span>
            </CardTitle>
            <CardDescription>
              {data.summary || "Son 7 gün önceki 4 haftaya kıyasla anormal."}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={scan}
            disabled={pending}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            Yenile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {visible.map((a) => (
          <AnomalyCard
            key={a.metric}
            anomaly={a}
            onDismiss={() => dismiss(a.metric)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function AnomalyCard({
  anomaly,
  onDismiss,
}: {
  anomaly: Anomaly;
  onDismiss: () => void;
}) {
  const tone =
    anomaly.severity === "high"
      ? "border-red-500/40 bg-red-500/[0.05]"
      : anomaly.severity === "medium"
        ? "border-amber-500/30 bg-amber-500/[0.04]"
        : "border-indigo-500/30 bg-indigo-500/[0.03]";
  const iconColor =
    anomaly.severity === "high"
      ? "text-red-500"
      : anomaly.severity === "medium"
        ? "text-amber-600"
        : "text-indigo-500";

  const change = anomaly.change_pct;
  const sign = change != null && change > 0 ? "+" : "";

  return (
    <div className={cn("relative rounded-lg border p-3 text-sm", tone)}>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]"
        title="Yoksay"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2 pr-6">
        <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{anomaly.title}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                anomaly.severity === "high"
                  ? "bg-red-500/15 text-red-700 dark:text-red-400"
                  : anomaly.severity === "medium"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
              )}
            >
              {anomaly.severity}
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
          <p className="text-xs text-[color:var(--color-muted)]">
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
