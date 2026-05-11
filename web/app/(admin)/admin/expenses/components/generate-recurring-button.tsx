"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateRecurringExpensesAction } from "@/lib/actions/expenses";

export function GenerateRecurringButton() {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function run() {
    setFeedback(null);
    start(async () => {
      const r = await generateRecurringExpensesAction();
      if (!r.ok) {
        setFeedback({ ok: false, message: r.error ?? "Hata" });
      } else {
        setFeedback({
          ok: true,
          message:
            r.generated > 0
              ? `${r.generated} gider üretildi (${r.skipped} atlandı — vakti gelmemiş).`
              : `Hiç yeni gider yok (${r.skipped} template var, hepsi henüz vakti gelmedi).`,
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Üretiliyor...
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            Tekrarlananları üret
          </>
        )}
      </Button>
      {feedback && (
        <span
          className={
            "inline-flex items-center gap-1 text-[10px] " +
            (feedback.ok ? "text-emerald-600" : "text-red-500")
          }
        >
          {feedback.ok && <CheckCircle2 className="h-3 w-3" />}
          {feedback.message}
        </span>
      )}
    </div>
  );
}
