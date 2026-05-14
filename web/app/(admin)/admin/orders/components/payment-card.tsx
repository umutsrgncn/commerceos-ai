"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  TestTube2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ExistingPayment = {
  id: string;
  status: string;
  paymentLink: string | null;
  amountMinor: number;
  paidAt: Date | null;
  errorMessage: string | null;
  gateway: string;
  createdAt: Date;
};

export function PaymentCard({
  payments,
  iyzicoMode,
}: {
  payments: ExistingPayment[];
  iyzicoMode: "test" | "production";
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const captured = payments.find((p) => p.status === "CAPTURED");
  const activePending = payments.find(
    (p) => p.status === "PENDING" && p.paymentLink,
  );

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopyalanamadı, manuel kopyala");
    }
  }

  // Tahsil edildi
  if (captured) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Tahsil edildi
        </div>
        <div className="space-y-1 text-xs text-[color:var(--color-muted)]">
          <div>
            PayTR ·{" "}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                iyzicoMode === "test"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {iyzicoMode}
            </span>
          </div>
          {captured.paidAt && (
            <div>
              Ödeme tarihi: {new Date(captured.paidAt).toLocaleString("tr-TR")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-fuchsia-500" />
          Online ödeme
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            iyzicoMode === "test"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          )}
        >
          {iyzicoMode === "test" ? (
            <>
              <TestTube2 className="h-2.5 w-2.5" />
              SANDBOX
            </>
          ) : (
            "ÜRETİM"
          )}
        </span>
      </div>

      {activePending ? (
        <>
          <p className="text-xs text-[color:var(--color-muted)]">
            Ödeme linki üretildi. Müşteriye SMS/e-posta ile paylaş.
          </p>
          <div className="flex items-center gap-1.5">
            <a
              href={activePending.paymentLink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.03] px-2 py-1.5 text-[10px] font-mono hover:bg-[color:var(--color-fg)]/[0.06]"
              title={activePending.paymentLink ?? ""}
            >
              {activePending.paymentLink}
            </a>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => copyLink(activePending.paymentLink ?? "")}
              title="Kopyala"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <a
            href={activePending.paymentLink ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Button type="button" size="sm" variant="outline" className="w-full">
              <ExternalLink className="h-3.5 w-3.5" />
              Ödeme sayfasını aç
            </Button>
          </a>
        </>
      ) : (
        <p className="rounded-md bg-[color:var(--color-fg)]/[0.04] p-2.5 text-xs text-[color:var(--color-muted)]">
          Ödeme henüz alınmadı. Otopilot açıkken sipariş onaylanınca otomatik
          tahsilat başlar; manuel müdahale gerekmez.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {/* Geçmiş başarısızlar */}
      {payments
        .filter((p) => p.status === "FAILED")
        .slice(0, 1)
        .map((p) => (
          <div
            key={p.id}
            className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/[0.04] p-2 text-xs"
          >
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <div>
              <div className="font-medium">Önceki ödeme başarısız</div>
              <div className="text-[color:var(--color-muted)]">
                {p.errorMessage}
              </div>
            </div>
          </div>
        ))}

      {/* Test kart bilgisi */}
      {iyzicoMode === "test" && !captured && (
        <details className="text-[10px] text-[color:var(--color-muted)]">
          <summary className="cursor-pointer hover:text-[color:var(--color-fg)]">
            Sandbox test kartları
          </summary>
          <div className="mt-1.5 space-y-0.5 font-mono">
            <div>5528 7900 0000 0008 · 12/30 · 123 (Akbank)</div>
            <div>5170 4100 0000 0004 · 12/30 · 123 (3DS)</div>
            <div>4111 1111 1111 1129 · 12/30 · 123 (Başarısız)</div>
          </div>
        </details>
      )}
    </div>
  );
}
