"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Package,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAutoPilotSettingsAction } from "@/lib/actions/settings";
import { cn } from "@/lib/cn";

type AutoPilotInitial = {
  enabled: boolean;
  monthlyBudgetMinor: number | null;
  confidenceThreshold: number;
  autoReplyReviews: boolean;
  autoIssueInvoices: boolean;
  autoReorderStock: boolean;
  enabledAt: Date | null;
};

export function AutoPilotForm({ initial }: { initial: AutoPilotInitial }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [budget, setBudget] = useState(
    initial.monthlyBudgetMinor != null
      ? (initial.monthlyBudgetMinor / 100).toFixed(0)
      : "",
  );
  const [threshold, setThreshold] = useState(initial.confidenceThreshold);
  const [reviews, setReviews] = useState(initial.autoReplyReviews);
  const [invoices, setInvoices] = useState(initial.autoIssueInvoices);
  const [stock, setStock] = useState(initial.autoReorderStock);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function save() {
    setFeedback(null);
    const budgetMinor = budget
      ? Math.round(parseFloat(budget.replace(",", ".")) * 100)
      : null;
    if (budgetMinor !== null && (!Number.isFinite(budgetMinor) || budgetMinor < 0)) {
      setFeedback({ ok: false, message: "Bütçe geçersiz." });
      return;
    }
    start(async () => {
      const r = await updateAutoPilotSettingsAction({
        enabled,
        monthlyBudgetMinor: budgetMinor,
        confidenceThreshold: threshold,
        autoReplyReviews: reviews,
        autoIssueInvoices: invoices,
        autoReorderStock: stock,
      });
      if (!r.ok) {
        setFeedback({ ok: false, message: r.error ?? "Hata" });
      } else {
        setFeedback({
          ok: true,
          message: enabled
            ? "Otopilot aktif. AI olayları dinliyor."
            : "Otopilot kapatıldı. Manuel moda döndü.",
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div
        className={cn(
          "rounded-xl border p-4 transition",
          enabled
            ? "border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/[0.06] to-indigo-500/[0.04]"
            : "border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-md",
                enabled
                  ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500"
                  : "bg-[color:var(--color-fg)]/30",
              )}
            >
              {enabled ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">Otopilot Modu</span>
                {enabled && (
                  <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                    AKTİF
                  </span>
                )}
              </div>
              <p className="mt-0.5 max-w-md text-xs text-[color:var(--color-muted)]">
                AI mağazanın günlük operasyonunu yönetir: yorum cevapları,
                e-fatura kesimi, stok sipariş maili, havale eşleştirme. Sen
                onay vermek istemezsen direkt yapar; kararları{" "}
                <strong>Otopilot</strong> sayfasında izlersin.
              </p>
              {initial.enabledAt && enabled && (
                <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                  Aktif edildi: {initial.enabledAt.toLocaleDateString("tr-TR")}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition",
              enabled
                ? "bg-gradient-to-r from-fuchsia-500 to-indigo-500"
                : "bg-[color:var(--color-fg)]/15",
            )}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                enabled ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>

      {/* Sub-settings */}
      <div className={cn("space-y-3", !enabled && "opacity-60")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ap-budget">
              Aylık operasyon bütçesi (₺, opsiyonel)
            </Label>
            <Input
              id="ap-budget"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              disabled={!enabled}
            />
            <p className="text-[10px] text-[color:var(--color-muted)]">
              AI bu bütçeyi aşacak işlemleri öneri olarak bekletir.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-threshold">
              Otomatik aksiyon güven eşiği: %{threshold}
            </Label>
            <input
              id="ap-threshold"
              type="range"
              min={0}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={!enabled}
              className="w-full accent-fuchsia-500"
            />
            <p className="text-[10px] text-[color:var(--color-muted)]">
              Bu değerin altındaki AI kararları manuel onay bekler.
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
            Otomasyon kuralları
          </div>
          <ToggleRow
            icon={<MessageSquare className="h-3.5 w-3.5 text-amber-500" />}
            label="Yorum cevapları"
            description="Yeni yorum geldiğinde AI samimi bir cevap üretir ve yayınlar"
            checked={reviews}
            onChange={setReviews}
            disabled={!enabled}
          />
          <ToggleRow
            icon={<Receipt className="h-3.5 w-3.5 text-emerald-500" />}
            label="E-fatura kesimi"
            description="Sipariş onaylandığında uygun belge tipiyle (e-fatura/e-arşiv) otomatik kesilir"
            checked={invoices}
            onChange={setInvoices}
            disabled={!enabled}
          />
          <ToggleRow
            icon={<Package className="h-3.5 w-3.5 text-indigo-500" />}
            label="Stok sipariş maili"
            description="Stok kritik seviyeye düştüğünde uygun tedarikçiye AI ile sipariş maili"
            checked={stock}
            onChange={setStock}
            disabled={!enabled}
          />
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-500",
          )}
        >
          {feedback.ok && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Otopilot ayarlarını kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-md p-2 transition",
        !disabled && "hover:bg-[color:var(--color-fg)]/[0.03]",
        disabled && "cursor-not-allowed",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 accent-fuchsia-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {label}
        </div>
        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
          {description}
        </p>
      </div>
    </label>
  );
}
