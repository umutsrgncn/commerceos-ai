"use client";

import { useState, useTransition, useEffect } from "react";
import { CheckCircle2, Loader2, Receipt, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { bulkIssueInvoicesAction } from "@/lib/actions/invoices";

/**
 * Toplu fatura kesme client'ı.
 *
 * Sayfada her sipariş satırında <input type="checkbox" name="bulkOrder"
 * value={orderId}/> olur. Bu component sadece "selectAll" ve "submit"
 * davranışını yönetir; checkbox'lar HTML state'inde, biz onları formdan değil
 * direkt querySelectorAll ile okuyoruz (server actions zaten redirect
 * yapacağı için form-local state yeterli).
 */
export function BulkInvoiceBar() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [docType, setDocType] = useState<"EFATURA" | "EARSIV">("EFATURA");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{
    succeeded: number;
    failed: number;
  } | null>(null);

  // Checkbox değişikliklerini yakala
  useEffect(() => {
    function update() {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="bulkOrder"]:checked',
      );
      setSelectedIds(Array.from(inputs).map((i) => i.value));
    }
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, []);

  function clearSelection() {
    document
      .querySelectorAll<HTMLInputElement>('input[name="bulkOrder"]:checked')
      .forEach((i) => {
        i.checked = false;
      });
    setSelectedIds([]);
    setFeedback(null);
  }

  function submit() {
    if (selectedIds.length === 0) return;
    setFeedback(null);
    start(async () => {
      const r = await bulkIssueInvoicesAction({
        orderIds: selectedIds,
        documentType: docType,
      });
      setFeedback({ succeeded: r.succeeded, failed: r.failed });
      if (r.succeeded > 0) {
        clearSelection();
      }
    });
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[min(640px,92vw)] -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 rounded-xl border border-fuchsia-500/30 bg-[color:var(--color-bg)]/95 p-3 shadow-2xl backdrop-blur">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white">
          <Receipt className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {selectedIds.length} sipariş seçildi
          </div>
          <div className="text-[10px] text-[color:var(--color-muted)]">
            Tüm seçilenlere otomatik fatura kesilir.
          </div>
        </div>

        <Select
          value={docType}
          onChange={(e) =>
            setDocType(e.target.value as "EFATURA" | "EARSIV")
          }
          className="h-9 text-xs"
        >
          <option value="EFATURA">E-Fatura (B2B)</option>
          <option value="EARSIV">E-Arşiv (B2C)</option>
        </Select>

        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Kesiliyor...
            </>
          ) : (
            <>
              <Receipt className="h-3.5 w-3.5" />
              Hepsine kes
            </>
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearSelection}
          aria-label="Seçimi temizle"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {feedback && (
        <div
          className={
            "mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-xs " +
            (feedback.failed === 0
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-amber-500/30 bg-amber-500/[0.04] text-amber-700 dark:text-amber-400")
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {feedback.succeeded} fatura kesildi
          {feedback.failed > 0 ? `, ${feedback.failed} başarısız` : ""}.
        </div>
      )}
    </div>
  );
}
