import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  Inbox,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "./components/review-actions";

export const metadata = { title: "KVKK Veri Silme Talepleri — CommerceOS" };
export const dynamic = "force-dynamic";

type FilterKey = "all" | "pending" | "approved" | "rejected" | "completed";

type SearchParams = { filter?: string };

const FILTER_OPTIONS: ReadonlyArray<{
  key: FilterKey;
  label: string;
  count: (s: StatusCounts) => number;
  tone: string;
  hoverTone: string;
}> = [
  {
    key: "all",
    label: "Tümü",
    count: (s) => s.total,
    tone: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-fg)]",
    hoverTone: "hover:bg-[color:var(--color-fg)]/[0.10]",
  },
  {
    key: "pending",
    label: "Bekleyen",
    count: (s) => s.pending,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    hoverTone: "hover:bg-amber-500/25",
  },
  {
    key: "approved",
    label: "Onaylanan",
    count: (s) => s.approved,
    tone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    hoverTone: "hover:bg-indigo-500/25",
  },
  {
    key: "completed",
    label: "Tamamlanan",
    count: (s) => s.completed,
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    hoverTone: "hover:bg-emerald-500/25",
  },
  {
    key: "rejected",
    label: "Reddedilen",
    count: (s) => s.rejected,
    tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    hoverTone: "hover:bg-rose-500/25",
  },
];

const STATUS_META: Record<
  string,
  {
    label: string;
    cls: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "Bekliyor",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: Hourglass,
  },
  APPROVED: {
    label: "Onaylandı",
    cls: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    icon: Sparkles,
  },
  REJECTED: {
    label: "Reddedildi",
    cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    icon: X,
  },
  COMPLETED: {
    label: "Tamamlandı",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
};

type StatusCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
};

function parseFilter(raw: string | undefined): FilterKey {
  if (raw === "pending" || raw === "approved" || raw === "rejected" || raw === "completed") {
    return raw;
  }
  return "all";
}

function whereFor(filter: FilterKey) {
  switch (filter) {
    case "pending":
      return { status: "PENDING" as const };
    case "approved":
      return { status: "APPROVED" as const };
    case "rejected":
      return { status: "REJECTED" as const };
    case "completed":
      return { status: "COMPLETED" as const };
    default:
      return {};
  }
}

export default async function DataRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);

  const [grouped, requests] = await Promise.all([
    db.dataDeletionRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.dataDeletionRequest.findMany({
      where: whereFor(filter),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const counts: StatusCounts = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  };
  for (const g of grouped) {
    const n = g._count._all;
    counts.total += n;
    if (g.status === "PENDING") counts.pending = n;
    else if (g.status === "APPROVED") counts.approved = n;
    else if (g.status === "REJECTED") counts.rejected = n;
    else if (g.status === "COMPLETED") counts.completed = n;
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-rose-500/[0.08] via-amber-500/[0.04] to-fuchsia-500/[0.06] p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-500/10 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-md">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              KVKK · Veri Silme Talepleri
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
              6698 sayılı kanun m.11 kapsamında müşteri talepleri.{" "}
              {counts.pending > 0 ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {counts.pending} bekleyen talep
                </span>
              ) : (
                <span>Tüm talepler işlenmiş.</span>
              )}{" "}
              · Yasal yanıt süresi <strong>30 gün</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <nav
        aria-label="Talep filtresi"
        className="flex flex-wrap gap-1.5"
        data-testid="data-requests-filter"
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key;
          const href = opt.key === "all" ? "/admin/data-requests" : `/admin/data-requests?filter=${opt.key}`;
          return (
            <Link
              key={opt.key}
              href={href as never}
              data-active={active ? "true" : "false"}
              data-testid={`filter-${opt.key}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? `border-transparent ${opt.tone} shadow-sm`
                  : `border-[color:var(--color-border)] bg-[color:var(--color-bg)]/40 text-[color:var(--color-muted)] ${opt.hoverTone}`
              }`}
            >
              {opt.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-mono tabular-nums ${
                  active
                    ? "bg-[color:var(--color-bg)]/60"
                    : "bg-[color:var(--color-fg)]/[0.06]"
                }`}
              >
                {opt.count(counts)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* List */}
      {requests.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="space-y-2.5" data-testid="data-requests-list">
          {requests.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
            const StatusIcon = meta.icon;
            const ageDays = daysSince(r.createdAt);
            const slaRemaining = 30 - ageDays;
            const isPending = r.status === "PENDING";
            const isApproved = r.status === "APPROVED";
            return (
              <li
                key={r.id}
                data-testid="data-request-item"
                data-status={r.status}
                className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4 transition hover:bg-[color:var(--color-fg)]/[0.02]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar
                      name={r.customerName ?? r.customerEmail}
                      anonymous={!r.customer}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {r.customerName ?? r.customerEmail}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        {r.customer ? (
                          <Link
                            href={`/admin/customers/${r.customer.id}`}
                            className="text-[10px] text-fuchsia-600 transition hover:underline dark:text-fuchsia-400"
                          >
                            müşteri kartı →
                          </Link>
                        ) : (
                          <Badge variant="warning">misafir</Badge>
                        )}
                        {isPending && slaRemaining <= 7 && slaRemaining >= 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                            <Clock className="h-3 w-3" />
                            {slaRemaining === 0
                              ? "Süresi bugün doluyor"
                              : `${slaRemaining} gün kaldı`}
                          </span>
                        )}
                        {isPending && slaRemaining < 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:text-rose-200">
                            <ShieldAlert className="h-3 w-3" />
                            SLA aşıldı ({-slaRemaining}g)
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[color:var(--color-muted)]">
                        <span className="font-mono">{r.customerEmail}</span>
                        <span>·</span>
                        <span>{formatRelative(r.createdAt)}</span>
                        {r.reviewedAt && (
                          <>
                            <span>·</span>
                            <span>
                              {r.status === "COMPLETED" ? "tamamlandı" : "incelendi"}{" "}
                              {formatRelative(r.reviewedAt)}
                            </span>
                          </>
                        )}
                      </div>
                      {r.reason && (
                        <p className="mt-2.5 whitespace-pre-wrap rounded-md bg-[color:var(--color-fg)]/[0.03] p-2.5 text-xs leading-relaxed text-[color:var(--color-fg)]/85">
                          <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                            Gerekçe ·{" "}
                          </span>
                          {r.reason}
                        </p>
                      )}
                      {r.reviewNote && (
                        <p className="mt-2 rounded-md border border-indigo-500/30 bg-indigo-500/[0.05] p-2.5 text-xs">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                            Yönetici notu ·{" "}
                          </span>
                          {r.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {(isPending || isApproved) && (
                    <ReviewActions requestId={r.id} canComplete={isApproved} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const copy =
    filter === "pending"
      ? {
          icon: ShieldCheck,
          title: "Bekleyen talep yok",
          desc: "Müşteri talepleri burada listelenir.",
        }
      : filter === "all"
        ? {
            icon: Trash2,
            title: "Henüz veri silme talebi yok",
            desc: "Müşteri /shop/account/settings sayfasından talep oluşturabilir.",
          }
        : {
            icon: Inbox,
            title: "Bu filtrede kayıt yok",
            desc: "Başka bir filtre dene veya 'Tümü'ne dön.",
          };
  const Icon = copy.icon;
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[color:var(--color-border)] py-12 text-center"
      data-testid="data-requests-empty"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">{copy.title}</p>
      <p className="text-xs text-[color:var(--color-muted)]">{copy.desc}</p>
    </div>
  );
}

function Avatar({ name, anonymous }: { name: string; anonymous: boolean }) {
  const initials = (name.match(/\b\w/g) ?? [name[0]]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold ring-1 ring-[color:var(--color-border)] ${
        anonymous
          ? "bg-stone-500/15 text-stone-600 dark:text-stone-300"
          : "bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-indigo-700 dark:text-indigo-300"
      }`}
      aria-hidden
    >
      {initials || "??"}
    </span>
  );
}

function daysSince(d: Date): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

function formatRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}
