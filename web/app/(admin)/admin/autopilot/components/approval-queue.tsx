"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Clock,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
import {
  approvePriceSuggestionAction,
  rejectAutoPilotActionAction,
  runPriceScanAction,
} from "@/lib/actions/autopilot-approval";
import { cn } from "@/lib/cn";

type PendingAction = {
  id: string;
  type: string;
  decision: string;
  reasoning: string | null;
  confidence: number | null;
  triggerSummary: string;
  metadata: unknown;
  createdAt: Date;
};

function formatTry(minor: number | undefined | null): string {
  if (minor == null) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(minor / 100);
}

function relTime(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "şimdi";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}dk önce`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}sa önce`;
  return new Date(d).toLocaleDateString("tr-TR");
}

export function ApprovalQueue({
  pending,
  enabled,
  autoSuggestPriceOn,
}: {
  pending: PendingAction[];
  enabled: boolean;
  autoSuggestPriceOn: boolean;
}) {
  const [scanning, startScan] = useTransition();
  const [scanResult, setScanResult] = useState<string | null>(null);

  function runScan() {
    setScanResult(null);
    startScan(async () => {
      const r = await runPriceScanAction();
      if (r.ok) {
        setScanResult(
          `Tarama tamam: ${r.scanned} ürün incelendi, ${r.suggested} öneri eklendi.`,
        );
      } else {
        setScanResult(`Hata: ${r.error}`);
      }
    });
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] to-fuchsia-500/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-500" />
              Onay bekleyen AI önerileri
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {pending.length}
              </span>
            </CardTitle>
            <CardDescription>
              Otopilot, eşik altında kalan kararları otomatik yapmaz; burada
              listelenir, manuel onayla veya yoksay.
            </CardDescription>
          </div>

          {enabled && autoSuggestPriceOn && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Taranıyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Fiyat tarayıcısını çalıştır
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {scanResult && (
          <div className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] p-2 text-xs text-emerald-700 dark:text-emerald-400">
            {scanResult}
          </div>
        )}

        {pending.length === 0 ? (
          <div className="py-6 text-center text-xs text-[color:var(--color-muted)]">
            Onay bekleyen öneri yok. Otopilot her şeyi kendi yapıyor.
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((a) => (
              <ApprovalRow key={a.id} action={a} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalRow({ action }: { action: PendingAction }) {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const meta = (action.metadata as Record<string, unknown>) ?? {};
  const isPriceSuggestion =
    typeof meta.suggestedPriceMinor === "number" &&
    typeof meta.productId === "string";
  const productName =
    (meta.productName as string) ?? action.triggerSummary;
  const currentPrice = meta.currentPriceMinor as number | undefined;
  const newPrice = meta.suggestedPriceMinor as number | undefined;
  const action2 = meta.action as string | undefined;

  function approve() {
    setFeedback(null);
    start(async () => {
      if (isPriceSuggestion) {
        const r = await approvePriceSuggestionAction(action.id);
        if (!r.ok) setFeedback(r.error ?? "Hata");
      }
    });
  }

  function reject() {
    setFeedback(null);
    start(async () => {
      const r = await rejectAutoPilotActionAction(action.id);
      if (!r.ok) setFeedback(r.error ?? "Hata");
    });
  }

  return (
    <li className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
            <span className="text-sm font-medium">{productName}</span>
            {action.confidence != null && (
              <span className="rounded-full bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] tabular-nums text-fuchsia-700 dark:text-fuchsia-400">
                güven %{action.confidence}
              </span>
            )}
            <span className="text-[10px] text-[color:var(--color-muted)]">
              {relTime(action.createdAt)}
            </span>
          </div>

          {isPriceSuggestion ? (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[color:var(--color-muted)]">
                  Şu an
                </span>
                <span className="font-mono tabular-nums">
                  {formatTry(currentPrice)}
                </span>
              </div>
              <span className="text-[color:var(--color-muted)]">→</span>
              <div className="flex items-center gap-1">
                {action2 === "increase" ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-amber-600" />
                )}
                <span className="font-mono tabular-nums font-semibold">
                  {formatTry(newPrice)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs">{action.decision}</p>
          )}

          {action.reasoning && (
            <p className="text-[10px] text-[color:var(--color-muted)] italic">
              {action.reasoning}
            </p>
          )}

          {feedback && (
            <p className="text-xs text-red-500">{feedback}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-1.5">
          {isPriceSuggestion && (
            <Button
              type="button"
              size="sm"
              onClick={approve}
              disabled={pending}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Onayla
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={reject}
            disabled={pending}
            title="Yoksay"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </li>
  );
}
