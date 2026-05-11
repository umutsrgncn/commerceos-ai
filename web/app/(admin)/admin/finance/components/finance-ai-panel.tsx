"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  periodLabel: string;
  revenueNetMinor: number;
  expenseTotalMinor: number;
  netProfitMinor: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  goalTargetMinor: number | null;
  goalProgressPct: number | null;
};

const CACHE_KEY = "commerceos:finance-ai-insight-v1";
type Cached = { ts: number; periodLabel: string; text: string };

export function FinanceAiPanel(props: Props) {
  const [text, setText] = useState("");
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Mount'ta cache'den yükle (aynı dönem etiketinde)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: Cached = JSON.parse(raw);
        if (parsed.periodLabel === props.periodLabel) {
          setText(parsed.text);
          setGeneratedAt(parsed.ts);
        }
      }
    } catch {}
  }, [props.periodLabel]);

  async function generate() {
    setText("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/finance-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_label: props.periodLabel,
          revenue_net_minor: props.revenueNetMinor,
          expense_total_minor: props.expenseTotalMinor,
          net_profit_minor: props.netProfitMinor,
          by_category: props.byCategory,
          goal_target_minor: props.goalTargetMinor,
          goal_progress_pct: props.goalProgressPct,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`AI servisi ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }

      // Bitince cache'e yaz
      const ts = Date.now();
      setGeneratedAt(ts);
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            ts,
            periodLabel: props.periodLabel,
            text: acc,
          } as Cached),
        );
      } catch {}
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            AI Finansal İçgörü
          </CardTitle>
          <CardDescription>
            Gelir, gider, hedef ve kategori dağılımına bakıp aksiyon önerir
          </CardDescription>
          {generatedAt && !streaming && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 text-[10px] text-[color:var(--color-muted)]">
              <Clock className="h-2.5 w-2.5" />
              {new Date(generatedAt).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              tarihinde üretildi
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={generate}
          disabled={streaming}
        >
          {streaming ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Yazıyor…
            </>
          ) : text ? (
            "Yenile"
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Üret
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!text && !streaming && !error && (
          <p className="text-sm text-[color:var(--color-muted)]">
            <strong>Üret</strong> butonuna basınca dönemine ait gelir/gider
            verisini Gemini'ye gönderir, 3-5 maddelik somut aksiyon önerisi
            alırım.
          </p>
        )}

        {(text || streaming) && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text}
            {streaming && (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-[color:var(--color-fg)]/40 align-text-bottom" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
