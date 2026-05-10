"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Package,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
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
  // Yorumlar
  autoReplyReviews: boolean;
  autoAnalyzeReviews: boolean;
  // Finans
  autoIssueInvoices: boolean;
  autoMatchBank: boolean;
  autoConfirmOrders: boolean;
  // Stok & Tedarikçi
  autoReorderStock: boolean;
  autoSuggestPrice: boolean;
  // Müşteri
  autoSegmentCustomers: boolean;
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

  // Rule toggles
  const [replyReviews, setReplyReviews] = useState(initial.autoReplyReviews);
  const [analyzeReviews, setAnalyzeReviews] = useState(
    initial.autoAnalyzeReviews,
  );
  const [issueInvoices, setIssueInvoices] = useState(
    initial.autoIssueInvoices,
  );
  const [matchBank, setMatchBank] = useState(initial.autoMatchBank);
  const [confirmOrders, setConfirmOrders] = useState(
    initial.autoConfirmOrders,
  );
  const [reorderStock, setReorderStock] = useState(initial.autoReorderStock);
  const [suggestPrice, setSuggestPrice] = useState(initial.autoSuggestPrice);
  const [segmentCustomers, setSegmentCustomers] = useState(
    initial.autoSegmentCustomers,
  );

  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const ruleCount = [
    replyReviews,
    analyzeReviews,
    issueInvoices,
    matchBank,
    confirmOrders,
    reorderStock,
    suggestPrice,
    segmentCustomers,
  ].filter(Boolean).length;

  function save() {
    setFeedback(null);
    const budgetMinor = budget
      ? Math.round(parseFloat(budget.replace(",", ".")) * 100)
      : null;
    if (
      budgetMinor !== null &&
      (!Number.isFinite(budgetMinor) || budgetMinor < 0)
    ) {
      setFeedback({ ok: false, message: "Bütçe geçersiz." });
      return;
    }
    start(async () => {
      const r = await updateAutoPilotSettingsAction({
        enabled,
        monthlyBudgetMinor: budgetMinor,
        confidenceThreshold: threshold,
        autoReplyReviews: replyReviews,
        autoAnalyzeReviews: analyzeReviews,
        autoIssueInvoices: issueInvoices,
        autoMatchBank: matchBank,
        autoConfirmOrders: confirmOrders,
        autoReorderStock: reorderStock,
        autoSuggestPrice: suggestPrice,
        autoSegmentCustomers: segmentCustomers,
      });
      if (!r.ok) {
        setFeedback({ ok: false, message: r.error ?? "Hata" });
      } else {
        setFeedback({
          ok: true,
          message: enabled
            ? `Otopilot aktif. ${ruleCount} kural çalışıyor — sağ alttan canlı izle.`
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
                {enabled && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                    {ruleCount}/8 kural
                  </span>
                )}
              </div>
              <p className="mt-0.5 max-w-md text-xs text-[color:var(--color-muted)]">
                AI mağazanın günlük operasyonunu yönetir. Aşağıdaki 4 kategori
                altında hangi olaylara müdahale etsin senin onayına bağlı.
                Aktif olduğunda <strong>sağ alttaki canlı pilot</strong>'tan
                AI'nın aldığı her kararı anlık görürsün.
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

      {/* Bütçe + Threshold */}
      <div className={cn("grid gap-3 sm:grid-cols-2", !enabled && "opacity-60")}>
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

      {/* Otomasyon kuralları — 4 kategori */}
      <div className={cn("space-y-3", !enabled && "opacity-60")}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
            Otomasyon kuralları
          </div>
          <span className="text-[10px] text-[color:var(--color-muted)]">
            {ruleCount} aktif / 8 toplam
          </span>
        </div>

        <RuleGroup
          icon={<MessageSquare className="h-3.5 w-3.5 text-amber-500" />}
          title="Yorumlar"
          accent="amber"
        >
          <ToggleRow
            label="Yorum cevapları"
            description="Yeni yorum geldiğinde AI samimi bir cevap üretir ve yayınlar"
            checked={replyReviews}
            onChange={setReplyReviews}
            disabled={!enabled}
          />
          <ToggleRow
            label="Negatif yorum analizi"
            description="3 yıldız altı yorumları AI 'şikayet/ürün sorunu/kargo' diye etiketler ve flag eder"
            checked={analyzeReviews}
            onChange={setAnalyzeReviews}
            disabled={!enabled}
          />
        </RuleGroup>

        <RuleGroup
          icon={<Receipt className="h-3.5 w-3.5 text-emerald-500" />}
          title="Finans & Faturalama"
          accent="emerald"
        >
          <ToggleRow
            label="E-fatura kesimi"
            description="Sipariş onaylandığında uygun belge tipiyle (e-fatura/e-arşiv) otomatik kesilir"
            checked={issueInvoices}
            onChange={setIssueInvoices}
            disabled={!enabled}
          />
          <ToggleRow
            label="Havale eşleştirme"
            description="Banka tx geldiğinde AI sipariş eşleştirir; eşik bu sayfadaki güven sliderı"
            checked={matchBank}
            onChange={setMatchBank}
            disabled={!enabled}
          />
          <ToggleRow
            label="Sipariş otomatik onayı"
            description="Havale eşleşince siparişi PENDING'den CONFIRMED'a alır (riskli — manuel önerilir)"
            checked={confirmOrders}
            onChange={setConfirmOrders}
            disabled={!enabled}
            warning
          />
        </RuleGroup>

        <RuleGroup
          icon={<Package className="h-3.5 w-3.5 text-indigo-500" />}
          title="Stok & Tedarikçi"
          accent="indigo"
        >
          <ToggleRow
            label="Stok sipariş maili"
            description="Stok kritik seviyeye düştüğünde uygun tedarikçiye AI ile sipariş maili"
            checked={reorderStock}
            onChange={setReorderStock}
            disabled={!enabled}
          />
          <ToggleRow
            label="Haftalık fiyat önerisi"
            description="AI haftalık marj/satış analizi yapar, fiyat önerilerini Otopilot timeline'a düşürür"
            checked={suggestPrice}
            onChange={setSuggestPrice}
            disabled={!enabled}
          />
        </RuleGroup>

        <RuleGroup
          icon={<Users className="h-3.5 w-3.5 text-fuchsia-500" />}
          title="Müşteri"
          accent="fuchsia"
        >
          <ToggleRow
            label="Müşteri segmentasyonu"
            description="Yeni müşteri eklendiğinde AI 'sadık/yeni/risky' diye etiketler"
            checked={segmentCustomers}
            onChange={setSegmentCustomers}
            disabled={!enabled}
          />
        </RuleGroup>
      </div>

      {feedback && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-sm",
            feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-500",
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
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

function RuleGroup({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: "amber" | "emerald" | "indigo" | "fuchsia";
  children: React.ReactNode;
}) {
  const borderClass = {
    amber: "border-amber-500/20 bg-amber-500/[0.02]",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.02]",
    indigo: "border-indigo-500/20 bg-indigo-500/[0.02]",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-500/[0.02]",
  }[accent];

  return (
    <div className={cn("rounded-lg border p-3", borderClass)}>
      <div className="flex items-center gap-1.5 pb-2 text-xs font-semibold tracking-wide">
        {icon}
        {title}
      </div>
      <div className="space-y-1 divide-y divide-[color:var(--color-border)]/50">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  warning,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  warning?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 py-2 transition",
        !disabled && "cursor-pointer",
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
          {label}
          {warning && (
            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              riskli
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
          {description}
        </p>
      </div>
    </label>
  );
}
