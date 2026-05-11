import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  FileText,
  Receipt,
  Search,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listInvoices, getInvoiceStats } from "@/lib/queries/invoices";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "E-Faturalar — CommerceOS" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  ACCEPTED: "Kabul edildi",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal",
};

const STATUS_VARIANT: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "warning",
};

type SP = { q?: string; page?: string; status?: string; doc?: string };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const [data, stats] = await Promise.all([
    listInvoices({
      q: params.q,
      page,
      status: params.status,
      documentType: params.doc,
    }),
    getInvoiceStats({ q: params.q }),
  ]);

  const acceptanceRate =
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-emerald-500/[0.06] via-indigo-500/[0.04] to-fuchsia-500/[0.04] px-4 py-4 sm:px-6 sm:py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-500 text-white shadow-md">
          <Receipt className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">E-Faturalar</h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            UBL-TR 1.2 standardında üretilir. Kurumsal alıcı için E-Fatura,
            son tüketici için E-Arşiv. Reddedilen faturayı yeniden gönderebilir,
            kabul edilen faturayı iptal edebilirsin.
          </p>
        </div>
      </div>

      {/* Stats — 4 kart */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Toplam fatura"
          value={String(stats.total)}
          hint={`${stats.efatura} E-Fatura · ${stats.earsiv} E-Arşiv`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Kabul tutarı"
          value={formatMoney(stats.acceptedTotalMinor, "TRY")}
          hint={`KDV: ${formatMoney(stats.taxMinor, "TRY")}`}
          tone="success"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Kabul oranı"
          value={`%${acceptanceRate}`}
          hint={`${stats.accepted} / ${stats.total} fatura`}
          tone={acceptanceRate >= 90 ? "success" : "neutral"}
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Sorunlu"
          value={String(stats.rejected + stats.cancelled)}
          hint={`${stats.rejected} reddedildi · ${stats.cancelled} iptal`}
          tone={stats.rejected > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Search + filter chips */}
      <div className="space-y-3">
        <form action="/admin/invoices" className="max-w-md">
          {params.status && (
            <input type="hidden" name="status" value={params.status} />
          )}
          {params.doc && <input type="hidden" name="doc" value={params.doc} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
            <Input
              name="q"
              defaultValue={params.q}
              placeholder="Fatura no, sipariş no, müşteri ara"
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
            href={chipHref(params, { status: "ACCEPTED" })}
            active={params.status === "ACCEPTED"}
            label="Kabul"
            count={stats.accepted}
          />
          <FilterChip
            href={chipHref(params, { status: "DRAFT" })}
            active={params.status === "DRAFT"}
            label="Taslak"
            count={stats.draft}
          />
          <FilterChip
            href={chipHref(params, { status: "REJECTED" })}
            active={params.status === "REJECTED"}
            label="Reddedildi"
            count={stats.rejected}
            tone="danger"
          />
          <FilterChip
            href={chipHref(params, { status: "CANCELLED" })}
            active={params.status === "CANCELLED"}
            label="İptal"
            count={stats.cancelled}
            tone="warning"
          />

          <span className="ml-3 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Belge:
          </span>
          <FilterChip
            href={chipHref(params, { doc: undefined })}
            active={!params.doc}
            label="Hepsi"
          />
          <FilterChip
            href={chipHref(params, { doc: "EFATURA" })}
            active={params.doc === "EFATURA"}
            label="E-Fatura"
            icon={<Building2 className="h-3 w-3" />}
            count={stats.efatura}
          />
          <FilterChip
            href={chipHref(params, { doc: "EARSIV" })}
            active={params.doc === "EARSIV"}
            label="E-Arşiv"
            icon={<User className="h-3 w-3" />}
            count={stats.earsiv}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <Receipt className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">Bu filtrede fatura yok</h3>
              <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
                Sipariş detayında <strong>"E-fatura kes"</strong> butonuyla
                ilk faturayı oluştur. Test modda mock yanıt, prod modda
                kendi entegratörüne gider.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Fatura no</th>
                    <th className="px-4 py-3 text-left font-medium">Tip</th>
                    <th className="px-4 py-3 text-left font-medium">Sipariş</th>
                    <th className="px-4 py-3 text-left font-medium">Müşteri</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-left font-medium">Mod</th>
                    <th className="px-4 py-3 text-right font-medium">Tutar</th>
                    <th className="px-4 py-3 text-right font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-4 py-3 font-mono">
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          className="hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <DocChip type={inv.documentType} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${inv.orderId}`}
                          className="font-mono text-xs hover:underline"
                        >
                          {inv.order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {inv.order.customer.name}
                        <div className="text-xs text-[color:var(--color-muted)]">
                          {inv.order.customer.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[inv.status] ?? "neutral"}>
                          {STATUS_LABEL[inv.status] ?? inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                          {inv.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatMoney(inv.totalMinor, inv.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(inv.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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
  return qs ? `/admin/invoices?${qs}` : "/admin/invoices";
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
  tone?: "danger" | "warning";
}) {
  const activeClass = active
    ? tone === "danger"
      ? "bg-red-500/10 text-red-600 border-red-500/30"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
        : "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)] border-[color:var(--color-border)]"
    : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.04]";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition",
        activeClass
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

function DocChip({ type }: { type: string }) {
  const isEarsiv = type === "EARSIV";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        isEarsiv
          ? "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      )}
    >
      {isEarsiv ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
      {isEarsiv ? "E-ARŞİV" : "E-FATURA"}
    </span>
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
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "danger"
        ? "bg-red-500/10 text-red-600"
        : "bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]";
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            toneClass
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
