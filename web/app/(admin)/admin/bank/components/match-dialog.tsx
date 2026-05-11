"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Trash2,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ignoreBankTxAction,
  linkBankTxAction,
  unlinkBankTxAction,
} from "@/lib/actions/bank";

type Candidate = {
  id: string;
  orderNumber: string;
  totalMinor: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  createdAt: string; // ISO
};

export function MatchDialog({
  bankTxId,
  amountMinor,
  candidates,
  suggestedOrderId,
  suggestedConfidence,
  suggestedReasoning,
  isMatched,
}: {
  bankTxId: string;
  amountMinor: number;
  candidates: Candidate[];
  suggestedOrderId?: string | null;
  suggestedConfidence?: number | null;
  suggestedReasoning?: string | null;
  isMatched: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function link(orderId: string) {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("bankTxId", bankTxId);
      fd.append("orderId", orderId);
      const r = await linkBankTxAction(fd);
      if (!r.ok) setError(r.error ?? "Hata");
      else setOpen(false);
    });
  }

  function unlink() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("bankTxId", bankTxId);
      await unlinkBankTxAction(fd);
      setOpen(false);
    });
  }

  function ignore() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("bankTxId", bankTxId);
      await ignoreBankTxAction(fd);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {isMatched ? "Düzenle" : "Eşleştir"}
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3">
          <div>
            <h2 className="text-base font-semibold">Sipariş eşleştir</h2>
            <p className="text-xs text-[color:var(--color-muted)]">
              Tutar:{" "}
              <span className="font-mono">
                {(amountMinor / 100).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                ₺
              </span>
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Kapat
          </Button>
        </div>

        <div className="max-h-[65vh] themed-scroll overflow-y-auto p-5 space-y-3">
          {suggestedOrderId && suggestedConfidence != null && (
            <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/[0.04] p-3 text-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-500" />
                <div>
                  <div className="font-medium text-fuchsia-700 dark:text-fuchsia-400">
                    AI önerisi (%{suggestedConfidence})
                  </div>
                  <div className="mt-0.5 text-[color:var(--color-muted)]">
                    {suggestedReasoning ?? "—"}
                  </div>
                  <div className="mt-1 text-[color:var(--color-muted)]">
                    85% altında olduğu için otomatik eşleşmedi, manuel onay
                    bekleniyor.
                  </div>
                </div>
              </div>
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--color-muted)]">
              Bu tutara yakın bekleyen sipariş yok.
            </p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => {
                const isSuggested = c.id === suggestedOrderId;
                return (
                  <div
                    key={c.id}
                    className={
                      "flex items-center justify-between gap-3 rounded-lg border p-3 transition " +
                      (isSuggested
                        ? "border-fuchsia-500/40 bg-fuchsia-500/[0.04]"
                        : "border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.025]")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {c.orderNumber}
                        </span>
                        {isSuggested && (
                          <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                            <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
                            AI önerdi
                          </span>
                        )}
                        <span className="font-mono text-sm tabular-nums">
                          {(c.totalMinor / 100).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                        {c.customerName} · {c.customerEmail} ·{" "}
                        {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => link(c.id)}
                      disabled={pending}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Eşleştir
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-[color:var(--color-border)] pt-3 text-xs text-[color:var(--color-muted)]">
            Diğer aksiyonlar:
          </div>
          <div className="flex flex-wrap gap-2">
            {isMatched && (
              <Button
                size="sm"
                variant="ghost"
                onClick={unlink}
                disabled={pending}
              >
                <Unlink className="h-3.5 w-3.5" />
                Eşleşmeyi kaldır
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={ignore}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Alakasız (komisyon, transfer vb.)
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
