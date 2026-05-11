import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building,
  CheckCircle2,
  CircleAlert,
  FileUp,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getBankStats,
  listBankTransactions,
  suggestOrdersForBankTx,
} from "@/lib/queries/bank";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MatchDialog } from "./components/match-dialog";
import { SimulatorPanel } from "./components/simulator-panel";

export const metadata = { title: "Banka işlemleri — CommerceOS" };

const STATUS_LABEL: Record<string, string> = {
  UNMATCHED: "Eşleşmedi",
  AUTO_MATCHED: "AI eşleştirdi",
  MANUAL_MATCHED: "Manuel eşleşti",
  IGNORED: "Alakasız",
};

const STATUS_VARIANT: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  UNMATCHED: "warning",
  AUTO_MATCHED: "success",
  MANUAL_MATCHED: "info",
  IGNORED: "neutral",
};

type SP = { q?: string; page?: string; status?: string; dir?: string };

export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [data, stats] = await Promise.all([
    listBankTransactions({
      q: params.q,
      page,
      status: params.status,
      direction: params.dir,
    }),
    getBankStats({ q: params.q }),
  ]);

  // Eşleşmemiş tx'ler için aday siparişleri pre-fetch et (dialog için)
  const unmatchedIds = data.items
    .filter((t) => t.status === "UNMATCHED" && t.direction === "IN")
    .map((t) => ({ id: t.id, amount: t.amountMinor }));

  const candidatesById: Record<
    string,
    Awaited<ReturnType<typeof suggestOrdersForBankTx>>
  > = {};
  await Promise.all(
    unmatchedIds.map(async (t) => {
      candidatesById[t.id] = await suggestOrdersForBankTx(t.amount, 8);
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-4 flex-1">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-500 text-white shadow-md">
            <Building className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Banka işlemleri
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
              Havale & EFT'leri sipariş ödemeleriyle eşleştir. CSV extre
              yükle veya production-ready webhook simülatörü ile test havalesi
              gönder; AI ≥85% güvenle otomatik eşleştirir.
            </p>
          </div>
        </div>
        <Link href="/admin/bank/import">
          <Button>
            <FileUp className="h-4 w-4" />
            CSV yükle
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Toplam işlem"
          value={String(stats.total)}
          hint={`${stats.matched} eşleşti · ${stats.unmatched} bekliyor`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Bu ay tahsilat"
          value={formatMoney(stats.monthInflowMinor, "TRY")}
          hint={`${stats.monthInflowCount} havale`}
          tone="success"
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="AI başarı oranı"
          value={`%${stats.matchRate}`}
          hint={`${stats.autoMatched} otomatik · ${stats.manualMatched} manuel`}
          tone={stats.matchRate >= 70 ? "success" : "neutral"}
        />
        <StatCard
          icon={<CircleAlert className="h-4 w-4" />}
          label="Onay bekleyen"
          value={String(stats.unmatched)}
          hint={
            stats.unmatched > 0
              ? "AI önerisi varsa rozetli, manuel onayla"
              : "Tüm tahsilatlar eşleşti"
          }
          tone={stats.unmatched > 0 ? "warning" : "success"}
        />
      </div>

      {/* Search + filter chips */}
      <div className="space-y-3">
        <form action="/admin/bank" className="max-w-md">
          {params.status && (
            <input type="hidden" name="status" value={params.status} />
          )}
          {params.dir && <input type="hidden" name="dir" value={params.dir} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
            <Input
              name="q"
              defaultValue={params.q}
              placeholder="Açıklama, banka, ref no veya sipariş no ara"
              className="pl-9"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Durum:
          </span>
          <FilterChip
            href={chipHref(params, { status: undefined })}
            active={!params.status}
            label="Tümü"
            count={stats.total}
          />
          <FilterChip
            href={chipHref(params, { status: "UNMATCHED" })}
            active={params.status === "UNMATCHED"}
            label="Onay bekliyor"
            count={stats.unmatched}
            tone="warning"
          />
          <FilterChip
            href={chipHref(params, { status: "AUTO_MATCHED" })}
            active={params.status === "AUTO_MATCHED"}
            label="AI eşleştirdi"
            count={stats.autoMatched}
            tone="success"
          />
          <FilterChip
            href={chipHref(params, { status: "MANUAL_MATCHED" })}
            active={params.status === "MANUAL_MATCHED"}
            label="Manuel eşleşti"
            count={stats.manualMatched}
          />
          <FilterChip
            href={chipHref(params, { status: "IGNORED" })}
            active={params.status === "IGNORED"}
            label="Alakasız"
            count={stats.ignored}
          />

          <span className="ml-3 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Yön:
          </span>
          <FilterChip
            href={chipHref(params, { dir: undefined })}
            active={!params.dir}
            label="Hepsi"
          />
          <FilterChip
            href={chipHref(params, { dir: "IN" })}
            active={params.dir === "IN"}
            label="Gelen"
            icon={<ArrowDownToLine className="h-3 w-3" />}
          />
          <FilterChip
            href={chipHref(params, { dir: "OUT" })}
            active={params.dir === "OUT"}
            label="Giden"
            icon={<ArrowUpFromLine className="h-3 w-3" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                  <Wallet className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">İşlem yok</h3>
                <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
                  CSV extre yükle ya da sağdaki simülatörden test havalesi
                  gönder.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                      <th className="px-4 py-3 text-left font-medium">Tarih</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Açıklama
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Tutar
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Durum</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Sipariş
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((tx) => {
                      const isIn = tx.direction === "IN";
                      const isMatched =
                        tx.status === "AUTO_MATCHED" ||
                        tx.status === "MANUAL_MATCHED";
                      const candidates = (candidatesById[tx.id] ?? []).map(
                        (o) => ({
                          id: o.id,
                          orderNumber: o.orderNumber,
                          totalMinor: o.total,
                          currency: o.currency,
                          customerName: o.customer.name,
                          customerEmail: o.customer.email,
                          createdAt: o.createdAt.toISOString(),
                        }),
                      );

                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                        >
                          <td className="px-4 py-3 text-xs tabular-nums">
                            {tx.transactionDate.toLocaleDateString("tr-TR")}
                            <div className="text-[10px] text-[color:var(--color-muted)]">
                              {formatRelativeTime(tx.transactionDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-md">
                            <div className="line-clamp-2" title={tx.description}>
                              {tx.description}
                            </div>
                            <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                              {tx.bankName}
                              {tx.reference && (
                                <span className="font-mono">
                                  {" "}
                                  · ref {tx.reference}
                                </span>
                              )}
                              {tx.source === "WEBHOOK" && (
                                <span className="ml-1 rounded bg-fuchsia-500/10 px-1 py-0.5 text-[9px] uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                                  WEBHOOK
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={
                              "px-4 py-3 text-right tabular-nums font-medium " +
                              (isIn ? "text-emerald-600" : "text-red-500")
                            }
                          >
                            {isIn ? "+" : ""}
                            {formatMoney(tx.amountMinor, tx.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={STATUS_VARIANT[tx.status] ?? "neutral"}
                            >
                              {STATUS_LABEL[tx.status] ?? tx.status}
                            </Badge>
                            {tx.matchConfidence != null &&
                              tx.status === "AUTO_MATCHED" && (
                                <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                                  AI %{tx.matchConfidence}
                                </div>
                              )}
                            {tx.matchConfidence != null &&
                              tx.status === "UNMATCHED" && (
                                <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] text-fuchsia-700 dark:text-fuchsia-400">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI öneri %{tx.matchConfidence}
                                </div>
                              )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {tx.matchedOrder ? (
                              <Link
                                href={`/admin/orders/${tx.matchedOrder.id}`}
                                className="font-mono hover:underline"
                              >
                                {tx.matchedOrder.orderNumber}
                                <div className="text-[10px] text-[color:var(--color-muted)]">
                                  {tx.matchedOrder.customer.name}
                                </div>
                              </Link>
                            ) : (
                              <span className="text-[color:var(--color-muted)]">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isIn && (
                              <MatchDialog
                                bankTxId={tx.id}
                                amountMinor={tx.amountMinor}
                                candidates={candidates}
                                suggestedOrderId={tx.matchedOrderId}
                                suggestedConfidence={tx.matchConfidence}
                                suggestedReasoning={tx.matchReasoning}
                                isMatched={isMatched}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SimulatorPanel />
        </div>
      </div>
    </div>
  );
}

function chipHref(current: SP, override: Partial<SP>): string {
  const next = { ...current, ...override, page: undefined };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/admin/bank?${qs}` : "/admin/bank";
}

function FilterChip({
  href,
  active,
  label,
  count,
  icon,
  tone,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  tone?: "success" | "warning";
}) {
  const activeClass = active
    ? tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
        : "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)] border-[color:var(--color-border)]"
    : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.04]";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition",
        activeClass,
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="rounded-full bg-[color:var(--color-fg)]/[0.08] px-1.5 py-0 text-[10px] tabular-nums">
          {count}
        </span>
      )}
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
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
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
