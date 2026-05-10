"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyzeReviewsAction,
  type AnalyzeResult,
} from "@/lib/actions/review-ai";
import { cn } from "@/lib/cn";

const OVERALL_VARIANTS: Record<string, "success" | "neutral" | "danger"> = {
  pozitif: "success",
  nötr: "neutral",
  notr: "neutral",
  negatif: "danger",
};

const OVERALL_LABELS: Record<string, string> = {
  pozitif: "Pozitif",
  nötr: "Nötr",
  notr: "Nötr",
  negatif: "Negatif",
};

export function ReviewAiPanel({
  productId,
  reviewCount,
}: {
  productId: string;
  reviewCount: number;
}) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function run() {
    setPending(true);
    const res = await analyzeReviewsAction(productId);
    setPending(false);
    setResult(res);
  }

  if (reviewCount === 0) {
    return (
      <p className="text-xs text-[color:var(--color-muted)]">
        En az 1 yorum gerekli.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="sm"
        onClick={run}
        disabled={pending}
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Yorumlar inceleniyor…
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {result?.ok ? "Yeniden analiz et" : "AI ile özetle"}
          </>
        )}
      </Button>

      {result && !result.ok && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {result.error}
        </div>
      )}

      {result && result.ok && (
        <div className="space-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={OVERALL_VARIANTS[result.overall] ?? "neutral"}>
              {OVERALL_LABELS[result.overall] ?? result.overall}
            </Badge>
            <ScoreRing score={result.score} />
          </div>

          {result.positives && (
            <Block label="Olumlu öne çıkanlar" value={result.positives} tone="success" />
          )}
          {result.negatives && result.negatives.toLowerCase() !== "yok" && (
            <Block label="Olumsuz öne çıkanlar" value={result.negatives} tone="warning" />
          )}
          {result.repeated_complaint &&
            result.repeated_complaint.toLowerCase() !== "yok" && (
              <Block
                label="Tekrar eden şikayet"
                value={result.repeated_complaint}
                tone="danger"
              />
            )}
          {result.action && (
            <Block label="Aksiyon önerisi" value={result.action} tone="accent" />
          )}
        </div>
      )}
    </div>
  );
}

function Block({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "accent";
}) {
  const toneClass = {
    success: "border-l-emerald-500",
    warning: "border-l-amber-500",
    danger: "border-l-red-500",
    accent: "border-l-fuchsia-500",
  }[tone];
  return (
    <div className={cn("border-l-2 pl-2", toneClass)}>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-0.5 leading-snug">{value}</div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-500";
  return (
    <span className={cn("font-mono text-sm font-semibold tabular-nums", tone)}>
      {score}
    </span>
  );
}
