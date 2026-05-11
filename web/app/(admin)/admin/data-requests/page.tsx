import Link from "next/link";
import { ShieldAlert, Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "./components/review-actions";

export const metadata = { title: "KVKK Veri Silme Talepleri — CommerceOS" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "danger" | "warning" | "info"> =
  {
    PENDING: "warning",
    APPROVED: "info",
    REJECTED: "danger",
    COMPLETED: "success",
  };

export default async function DataRequestsPage() {
  const requests = await db.dataDeletionRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-red-500/[0.06] via-amber-500/[0.04] to-fuchsia-500/[0.04] px-4 py-4 sm:px-6 sm:py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-fuchsia-500 text-white shadow-md">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            KVKK Veri Silme Talepleri
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            6698 sayılı kanun m.11 kapsamında müşteri silme talepleri.
            {pendingCount > 0 && (
              <>
                {" "}
                <span className="font-medium text-amber-600">
                  {pendingCount} bekleyen talep
                </span>{" "}
                — 30 gün içinde yanıt zorunlu.
              </>
            )}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[color:var(--color-border)] py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
            <Trash2 className="h-5 w-5" />
          </span>
          <p className="text-sm text-[color:var(--color-muted)]">
            Henüz veri silme talebi yok.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {r.customerName ?? r.customerEmail}
                    </span>
                    <Badge variant={STATUS_TONE[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    {r.customer && (
                      <Link
                        href={`/admin/customers/${r.customer.id}`}
                        className="text-[10px] text-fuchsia-600 hover:underline dark:text-fuchsia-400"
                      >
                        müşteri →
                      </Link>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                    {r.customerEmail} ·{" "}
                    {new Date(r.createdAt).toLocaleString("tr-TR")}
                  </div>
                  {r.reason && (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-[color:var(--color-fg)]/[0.03] p-2 text-xs text-[color:var(--color-fg)]/85">
                      {r.reason}
                    </p>
                  )}
                  {r.reviewNote && (
                    <p className="mt-2 rounded-md border border-indigo-500/20 bg-indigo-500/[0.05] p-2 text-xs">
                      <span className="font-medium">Yönetici notu:</span>{" "}
                      {r.reviewNote}
                    </p>
                  )}
                </div>

                {r.status === "PENDING" || r.status === "APPROVED" ? (
                  <ReviewActions
                    requestId={r.id}
                    canComplete={r.status === "APPROVED"}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
