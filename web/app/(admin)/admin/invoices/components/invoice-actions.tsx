"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelInvoiceAction,
  reissueInvoiceAction,
} from "@/lib/actions/invoices";

export function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState("");

  function reissue() {
    setError(null);
    start(async () => {
      const r = await reissueInvoiceAction(invoiceId);
      if (!r.ok) setError(r.error ?? "Yeniden gönderilemedi");
    });
  }

  function cancel() {
    setError(null);
    start(async () => {
      const r = await cancelInvoiceAction(invoiceId, reason);
      if (!r.ok) setError(r.error ?? "İptal edilemedi");
      else setConfirmCancel(false);
    });
  }

  const canReissue = status === "REJECTED";
  const canCancel = status === "SENT" || status === "ACCEPTED";

  if (!canReissue && !canCancel) return null;

  return (
    <div className="space-y-2">
      {canReissue && (
        <Button
          type="button"
          size="sm"
          onClick={reissue}
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Yeniden gönder
        </Button>
      )}

      {canCancel && !confirmCancel && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setConfirmCancel(true)}
          disabled={pending}
          className="w-full"
        >
          <XCircle className="h-3.5 w-3.5" />
          Faturayı iptal et
        </Button>
      )}

      {confirmCancel && (
        <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-2 flex-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Faturayı iptal etmek istediğinden emin misin?
              </p>
              <p className="text-[color:var(--color-muted)]">
                İptal edilmiş fatura GİB sisteminde gözükür ama geçersiz sayılır.
                Üretim modunda entegratöre iptal isteği gönderilir.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  İptal sebebi (opsiyonel)
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Müşteri talebi, hatalı tutar, vb."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmCancel(false)}
                  disabled={pending}
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={cancel}
                  disabled={pending}
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Evet, iptal et
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
