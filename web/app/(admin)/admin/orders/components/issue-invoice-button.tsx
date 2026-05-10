"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, FileText, Loader2, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  issueInvoiceAction,
  type DocumentType,
  type IssueInvoiceResult,
} from "@/lib/actions/invoices";

const DOC_LABEL: Record<DocumentType, string> = {
  EFATURA: "E-Fatura",
  EARSIV: "E-Arşiv",
};

const DOC_HINT: Record<DocumentType, string> = {
  EFATURA: "B2B / VKN'li alıcı (kurumsal)",
  EARSIV: "B2C / son tüketici (bireysel)",
};

export function IssueInvoiceButton({
  orderId,
  existingInvoice,
}: {
  orderId: string;
  existingInvoice: {
    invoiceNumber: string;
    status: string;
    mode: string;
    documentType?: string;
  } | null;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<IssueInvoiceResult | null>(null);
  const [open, setOpen] = useState(false);

  function issue(documentType: DocumentType) {
    setResult(null);
    setOpen(false);
    start(async () => {
      const res = await issueInvoiceAction(orderId, documentType);
      setResult(res);
    });
  }

  if (existingInvoice && existingInvoice.status === "ACCEPTED") {
    const docLabel =
      existingInvoice.documentType === "EARSIV" ? "E-Arşiv" : "E-Fatura";
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          <span className="font-medium">{docLabel} kesildi</span>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            {existingInvoice.mode}
          </span>
        </div>
        <div className="mt-1 font-mono text-[color:var(--color-muted)]">
          {existingInvoice.invoiceNumber}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          className="w-full justify-between"
        >
          <span className="inline-flex items-center gap-1.5">
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Receipt className="h-3.5 w-3.5" />
            )}
            {pending
              ? "Kesiliyor…"
              : existingInvoice
                ? "Yeniden kes"
                : "E-fatura / E-arşiv kes"}
          </span>
          {!pending && <ChevronDown className="h-3.5 w-3.5" />}
        </Button>

        {open && !pending && (
          <div className="absolute right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-lg">
            {(["EFATURA", "EARSIV"] as DocumentType[]).map((dt) => (
              <button
                key={dt}
                type="button"
                onClick={() => issue(dt)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-muted)]" />
                <div>
                  <div className="font-medium">{DOC_LABEL[dt]} kes</div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">
                    {DOC_HINT[dt]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {result && !result.ok && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {result.error}
        </div>
      )}
      {result && result.ok && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">
          {result.invoiceNumber} kesildi · {DOC_LABEL[result.documentType]} ·{" "}
          {result.mode}
        </div>
      )}
    </div>
  );
}
