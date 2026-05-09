"use client";

import { useState } from "react";
import { Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SegmentResult = {
  segment: string;
  rationale: string;
  action: string;
} | null;

const SEGMENT_VARIANT: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  VIP: "success",
  Sadık: "info",
  Yeni: "info",
  Sessizleşen: "warning",
  Riskli: "danger",
  "Düşük etkileşim": "neutral",
};

export function SegmentPanel({ customerId }: { customerId: string }) {
  const [result, setResult] = useState<SegmentResult>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Hata");
      } else {
        setResult({
          segment: data.segment,
          rationale: data.rationale,
          action: data.action,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPending(false);
    }
  }

  const variant = result ? (SEGMENT_VARIANT[result.segment] ?? "neutral") : "neutral";

  return (
    <div className="space-y-3">
      <Button type="button" size="sm" onClick={run} disabled={pending} className="w-full">
        <Sparkles className="h-3.5 w-3.5" />
        {pending ? "Analiz ediliyor..." : result ? "Yeniden segmente et" : "AI ile segmente et"}
      </Button>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[color:var(--color-muted)]" />
            <Badge variant={variant}>{result.segment}</Badge>
          </div>
          {result.rationale && (
            <div>
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                Gerekçe
              </div>
              <p className="text-sm">{result.rationale}</p>
            </div>
          )}
          {result.action && (
            <div>
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                Önerilen aksiyon
              </div>
              <p className="text-sm">{result.action}</p>
            </div>
          )}
        </div>
      )}

      {!result && !error && !pending && (
        <p className="text-xs text-[color:var(--color-muted)]">
          Sipariş geçmişinden Gemini etiket önerir.
        </p>
      )}
    </div>
  );
}
