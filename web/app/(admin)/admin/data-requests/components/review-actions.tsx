"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewDeletionRequestAction } from "@/lib/actions/kvkk";

export function ReviewActions({
  requestId,
  canComplete,
}: {
  requestId: string;
  canComplete: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [pendingDecision, setPendingDecision] =
    useState<"approve" | "reject" | "complete" | null>(null);

  function decide(decision: "approve" | "reject" | "complete") {
    setError(null);
    setPendingDecision(decision);
    start(async () => {
      const r = await reviewDeletionRequestAction(requestId, decision, note || undefined);
      if (!r.ok) setError(r.error ?? "Hata");
      setPendingDecision(null);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      {showNote && (
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Not (opsiyonel)"
          className="text-xs sm:w-64"
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        {canComplete ? (
          <Button
            type="button"
            size="sm"
            onClick={() => decide("complete")}
            disabled={pending}
          >
            {pending && pendingDecision === "complete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Tamamlandı işaretle
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => decide("approve")}
              disabled={pending}
            >
              {pending && pendingDecision === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Onayla
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => decide("reject")}
              disabled={pending}
            >
              {pending && pendingDecision === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Reddet
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowNote((v) => !v)}
        >
          {showNote ? "Notu gizle" : "Not ekle"}
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
