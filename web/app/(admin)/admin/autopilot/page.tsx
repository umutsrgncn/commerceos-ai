import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Package,
  Receipt,
  Settings as SettingsIcon,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings } from "@/lib/queries/settings";
import {
  getAutoPilotStats,
  listAutoPilotActions,
} from "@/lib/queries/autopilot";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DemoButtons } from "./components/demo-buttons";
import { ApprovalQueue } from "./components/approval-queue";

export const metadata = { title: "Otopilot — CommerceOS" };

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  REVIEW_REPLY: {
    label: "Yorum cevabı",
    icon: MessageSquare,
    color: "text-amber-500",
  },
  INVOICE_ISSUE: {
    label: "E-fatura kesimi",
    icon: Receipt,
    color: "text-emerald-500",
  },
  STOCK_REORDER: {
    label: "Stok sipariş",
    icon: Package,
    color: "text-indigo-500",
  },
  BANK_MATCH: {
    label: "Havale eşleştirme",
    icon: Receipt,
    color: "text-fuchsia-500",
  },
  ORDER_CONFIRM: {
    label: "Sipariş onayı",
    icon: Receipt,
    color: "text-indigo-500",
  },
};

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  EXECUTED: {
    label: "Yapıldı",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Bekliyor",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: Clock,
  },
  FAILED: {
    label: "Başarısız",
    color: "text-red-600",
    bg: "bg-red-500/10 border-red-500/30",
    icon: XCircle,
  },
  SKIPPED: {
    label: "Atlandı",
    color: "text-[color:var(--color-muted)]",
    bg: "bg-[color:var(--color-fg)]/[0.05] border-[color:var(--color-border)]",
    icon: AlertCircle,
  },
};

export default async function AutoPilotPage() {
  const [settings, stats, actions, pending] = await Promise.all([
    getSettings(),
    getAutoPilotStats(),
    listAutoPilotActions({ pageSize: 50 }),
    listAutoPilotActions({ pageSize: 50, status: "SKIPPED" }),
  ]);

  const enabled = settings.autoPilotEnabled;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-md",
              enabled
                ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500"
                : "bg-[color:var(--color-fg)]/30",
            )}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Otopilot
              </h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  enabled
                    ? "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400"
                    : "bg-[color:var(--color-fg)]/10 text-[color:var(--color-muted)]",
                )}
              >
                {enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-[color:var(--color-muted)]">
              AI'nın yaptığı her aksiyon burada timeline'da. Yorum cevapları,
              e-fatura kesimleri, stok siparişleri — hepsi tek panelden izlenir.
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-fg)]/[0.04]"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          Ayarları aç
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Bu hafta aksiyon"
          value={String(stats.weekTotal)}
          hint={`Toplam ${stats.total}`}
          tone="info"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Yapıldı"
          value={String(stats.executed)}
          hint="AI otomatik gerçekleştirdi"
          tone="success"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Bekleyen"
          value={String(stats.pending)}
          hint="Manuel onay öneriliyor"
          tone={stats.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Başarısız + atlandı"
          value={String(stats.failed + stats.skipped)}
          hint={`${stats.failed} başarısız · ${stats.skipped} atlandı`}
          tone={stats.failed > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Approval queue — manuel onay bekleyen AI önerileri */}
      <ApprovalQueue
        pending={pending.items.map((a) => ({
          id: a.id,
          type: a.type,
          decision: a.decision,
          reasoning: a.reasoning,
          confidence: a.confidence,
          triggerSummary: a.triggerSummary,
          metadata: a.metadata,
          createdAt: a.createdAt,
        }))}
        enabled={enabled}
        autoSuggestPriceOn={settings.autoPilotAutoSuggestPrice}
      />

      {/* Demo simulator */}
      <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            Demo simülatörü
          </CardTitle>
          <CardDescription>
            Otopilot'un nasıl çalıştığını canlı göstermek için. Her buton
            uygun bir olayı tetikler, AI saniyeler içinde aksiyon alır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemoButtons enabled={enabled} />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="border-b border-[color:var(--color-border)]">
          <CardTitle>AI aksiyon timeline'ı</CardTitle>
          <CardDescription>
            Son {actions.items.length} karar — en yenisi üstte
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {actions.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">Henüz AI kararı yok</h3>
              <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
                Otopilot'u aktif et ve yukarıdaki demo butonlarından
                tetikle, ya da gerçek bir olay (yeni yorum, sipariş, stok
                düşüşü) bekle.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {actions.items.map((a) => {
                const tm = TYPE_META[a.type] ?? {
                  label: a.type,
                  icon: Sparkles,
                  color: "",
                };
                const sm = STATUS_META[a.status] ?? STATUS_META.PENDING;
                const TypeIcon = tm.icon;
                const StatusIcon = sm.icon;

                return (
                  <li key={a.id} className="px-5 py-3 hover:bg-[color:var(--color-fg)]/[0.02]">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--color-fg)]/[0.04]",
                          tm.color,
                        )}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{a.decision}</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                              sm.bg,
                              sm.color,
                            )}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {sm.label}
                          </span>
                          {a.confidence != null && (
                            <span className="rounded-full bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-700 dark:text-fuchsia-400">
                              %{a.confidence}
                            </span>
                          )}
                          <span className="text-[10px] text-[color:var(--color-muted)]">
                            {tm.label}
                          </span>
                        </div>
                        <div className="text-xs text-[color:var(--color-muted)]">
                          {a.triggerSummary}
                        </div>
                        {a.reasoning && (
                          <p className="text-xs italic text-[color:var(--color-muted)]">
                            {a.reasoning}
                          </p>
                        )}
                        {a.errorMessage && (
                          <p className="text-xs text-red-500">
                            Hata: {a.errorMessage}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-0.5 text-[10px] text-[color:var(--color-muted)]">
                          <span>{formatRelativeTime(a.createdAt)}</span>
                          {a.resultRef && (
                            <ResultLink resultRef={a.resultRef} />
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultLink({ resultRef }: { resultRef: string }) {
  const [type, id] = resultRef.split(":");
  const href =
    type === "order"
      ? `/admin/orders/${id}`
      : type === "review"
        ? `/admin/reviews?productId=${id}`
        : type === "invoice"
          ? `/admin/invoices/${id}`
          : type === "supplier"
            ? `/admin/suppliers/${id}`
            : null;
  if (!href) return null;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-fuchsia-600 hover:underline dark:text-fuchsia-400"
    >
      Detay <ExternalLink className="h-2.5 w-2.5" />
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "info"
        ? "bg-fuchsia-500/10 text-fuchsia-600"
        : tone === "warning"
          ? "bg-amber-500/10 text-amber-600"
          : tone === "danger"
            ? "bg-red-500/10 text-red-600"
            : "bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]";
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            toneClass,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
            {label}
          </div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
          {hint && (
            <div className="mt-0.5 truncate text-[10px] text-[color:var(--color-muted)]">
              {hint}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
