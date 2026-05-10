"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  setGoalAction,
  suggestGoalAction,
  type GoalActionState,
  type GoalSuggestResult,
} from "@/lib/actions/goals";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  period: string; // YYYY-MM
  periodLabel: string; // 'Mayıs 2026'
  currentRevenue: number;
  goal: { targetAmount: number; notes: string | null } | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Hedefi kaydet"}
    </Button>
  );
}

export function GoalWidget({ period, periodLabel, currentRevenue, goal }: Props) {
  const [editing, setEditing] = useState(!goal);
  const [draft, setDraft] = useState(
    goal ? (goal.targetAmount / 100).toFixed(0) : ""
  );
  const [ambition, setAmbition] = useState<"konservatif" | "dengeli" | "agresif">(
    "dengeli"
  );
  const [aiPending, startAi] = useTransition();
  const [aiResult, setAiResult] = useState<GoalSuggestResult | null>(null);

  const [saveState, saveAction] = useActionState<GoalActionState, FormData>(
    setGoalAction,
    null
  );

  if (saveState?.ok && editing) {
    setEditing(false);
  }

  const target = goal?.targetAmount ?? 0;
  const pct = target > 0 ? Math.min(100, (currentRevenue / target) * 100) : 0;
  const remaining = Math.max(0, target - currentRevenue);
  const reached = target > 0 && currentRevenue >= target;

  function askAi() {
    startAi(async () => {
      const res = await suggestGoalAction(ambition);
      setAiResult(res);
      if (res.ok) {
        setDraft((res.target_minor / 100).toFixed(0));
        setEditing(true);
      }
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
              Aylık hedef
            </div>
            <div className="text-sm font-semibold">{periodLabel}</div>
          </div>
        </div>
        {!editing && goal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="h-7 px-2 text-xs"
          >
            Düzenle
          </Button>
        )}
      </div>

      {!editing && goal ? (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">
              {formatMoney(currentRevenue, "TRY")}
            </span>
            <span className="text-sm text-[color:var(--color-muted)]">
              / {formatMoney(target, "TRY")}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.06]">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all",
                reached
                  ? "from-emerald-500 to-emerald-400"
                  : "from-indigo-500 to-fuchsia-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--color-muted)]">
            <span>%{pct.toFixed(1)}</span>
            <span>
              {reached ? (
                <span className="font-medium text-emerald-500">
                  ✓ Hedef ulaşıldı
                </span>
              ) : (
                <>Kalan: {formatMoney(remaining, "TRY")}</>
              )}
            </span>
          </div>
          {goal.notes && (
            <p className="mt-2 text-xs text-[color:var(--color-muted)]">
              {goal.notes}
            </p>
          )}
        </>
      ) : (
        <form action={saveAction} className="space-y-3">
          <input type="hidden" name="period" value={period} />

          <div className="space-y-1.5">
            <Label htmlFor="targetAmount" className="text-xs">
              Hedef tutar (₺)
            </Label>
            <Input
              id="targetAmount"
              name="targetAmount"
              inputMode="decimal"
              required
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="50000"
              className="h-9 text-sm"
            />
            {saveState?.fieldErrors?.targetAmount && (
              <p className="text-xs text-red-500">
                {saveState.fieldErrors.targetAmount[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">
              Not (opsiyonel)
            </Label>
            <Input
              id="notes"
              name="notes"
              className="h-9 text-sm"
              placeholder="Bayram kampanyası dahil"
            />
          </div>

          {/* AI öneri */}
          <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] p-3 text-xs">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3 w-3 text-fuchsia-500" />
                AI ile öner
              </span>
              <Select
                value={ambition}
                onChange={(e) => setAmbition(e.target.value as typeof ambition)}
                className="h-7 w-32 text-xs"
              >
                <option value="konservatif">Konservatif</option>
                <option value="dengeli">Dengeli</option>
                <option value="agresif">Agresif</option>
              </Select>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={askAi}
              disabled={aiPending}
              className="w-full"
            >
              {aiPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Geçmiş analiz ediliyor…
                </>
              ) : (
                "Hedef öner"
              )}
            </Button>

            {aiResult && !aiResult.ok && (
              <p className="mt-2 text-red-500">{aiResult.error}</p>
            )}
            {aiResult && aiResult.ok && (
              <div className="mt-2 space-y-1">
                <div className="text-[color:var(--color-muted)]">
                  Önerilen:{" "}
                  <span className="font-mono text-[color:var(--color-fg)]">
                    {formatMoney(aiResult.target_minor, "TRY")}
                  </span>
                  {" · "}
                  <span className="capitalize">{aiResult.ambition}</span>
                </div>
                {aiResult.reasoning && (
                  <p className="text-[color:var(--color-muted)]">
                    {aiResult.reasoning}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {goal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setDraft((goal.targetAmount / 100).toFixed(0));
                }}
              >
                Vazgeç
              </Button>
            )}
            <SaveButton />
          </div>
        </form>
      )}
    </div>
  );
}
