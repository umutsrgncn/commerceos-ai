"use client";

import { useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const PERIODS = [
  { value: 7, label: "Son 7 gün" },
  { value: 30, label: "Son 30 gün" },
  { value: 90, label: "Son 90 gün" },
];

export function InsightsPanel() {
  const [days, setDays] = useState(30);
  const [text, setText] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    setText("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/ai/insights?days=${days}`, {
        method: "POST",
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
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            AI içgörüleri
          </CardTitle>
          <CardDescription>
            Gemini son {days} günü analiz eder, aksiyon önerir.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={streaming}
            className="h-9 w-32 text-xs"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={generate}
            disabled={streaming}
          >
            {streaming ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Yazıyor
              </>
            ) : text ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Yenile
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Üret
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!text && !streaming && !error && (
          <p className="text-sm text-[color:var(--color-muted)]">
            Henüz analiz yok. <strong>Üret</strong> butonuna basarak başla.
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
