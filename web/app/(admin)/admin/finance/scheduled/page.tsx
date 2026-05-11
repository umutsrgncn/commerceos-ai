import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Flame, Plus } from "lucide-react";

import {
  listScheduledPayments,
  listUpcomingOccurrences,
} from "@/lib/queries/scheduled-payments";
import { formatMoney } from "@/lib/format";
import { StatTile } from "@/components/ui/stat-tile";

import { ScheduledPaymentsList } from "./components/scheduled-payments-list";
import { UpcomingCalendar } from "./components/upcoming-calendar";

export const metadata = { title: "Gelecek ödemeler — CommerceOS" };

export default async function ScheduledPaymentsPage() {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 90);

  const [payments, upcoming] = await Promise.all([
    listScheduledPayments(),
    listUpcomingOccurrences(now, horizon),
  ]);

  const totalNext30 = upcoming
    .filter((o) => o.date.getTime() - now.getTime() < 30 * 86400_000)
    .reduce((s, o) => s + o.amount, 0);
  const totalNext90 = upcoming.reduce((s, o) => s + o.amount, 0);
  const activeCount = payments.filter((p) => p.active).length;
  const next30Count = upcoming.filter(
    (o) => o.date.getTime() - now.getTime() < 30 * 86400_000,
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero/header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.08] via-fuchsia-500/[0.04] to-transparent p-5">
        <Link
          href="/admin/finance"
          className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="h-3 w-3" /> Finans
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Gelecek ödemeler
              </h1>
              <p className="mt-0.5 text-sm text-[color:var(--color-muted)] max-w-xl">
                Maaş, kira, vergi, abonelik gibi düzenli ödemeleri gir — AI
                nakit akışı tahmini bunları{" "}
                <strong className="text-[color:var(--color-fg)]">
                  kesin gider
                </strong>{" "}
                olarak kullanır.
              </p>
            </div>
          </div>
          <Link
            href="#new-payment"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni ödeme ekle
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Aktif ödeme"
          value={`${activeCount}`}
          hint={`${payments.length - activeCount} pasif`}
          tone="emerald"
        />
        <StatTile
          icon={<CalendarClock className="h-5 w-5" />}
          label="Önümüzdeki 30 gün"
          value={formatMoney(totalNext30, "TRY")}
          hint={`${next30Count} ödeme`}
          tone="amber"
        />
        <StatTile
          icon={<Flame className="h-5 w-5" />}
          label="Önümüzdeki 90 gün"
          value={formatMoney(totalNext90, "TRY")}
          hint={`${upcoming.length} ödeme`}
          tone="red"
        />
      </div>

      {/* 90-day calendar timeline */}
      <UpcomingCalendar
        from={now.toISOString()}
        items={upcoming.map((o) => ({
          date: o.date.toISOString(),
          paymentId: o.paymentId,
          name: o.name,
          amount: o.amount,
          category: o.category,
        }))}
      />

      {/* CRUD list */}
      <ScheduledPaymentsList
        items={payments.map((p) => ({
          ...p,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate ? p.endDate.toISOString() : null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}

