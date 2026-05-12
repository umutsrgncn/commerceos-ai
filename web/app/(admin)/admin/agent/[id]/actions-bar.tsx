"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Square, X } from "lucide-react";
import type { AgentTaskStatus } from "@prisma/client";

import {
  approveAgentTaskAction,
  cancelAgentTaskAction,
  rejectAgentTaskAction,
} from "@/lib/agent/actions";
import { ConfirmDialog } from "./confirm-dialog";

type DialogKind = "approve" | "reject" | "cancel" | null;

export function ActionsBar({
  id,
  status,
  tunnelUrl,
  port,
  cancelRequested,
}: {
  id: string;
  status: AgentTaskStatus;
  tunnelUrl: string | null;
  port: number | null;
  cancelRequested: boolean;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const router = useRouter();

  const canDecide = status === "REVIEW";
  const canCancel =
    status === "PENDING" ||
    status === "PLANNING" ||
    status === "RUNNING" ||
    status === "TESTING";

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Hata");
      setDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          {port && (
            <a
              href={`http://localhost:${port}/shop`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs font-medium hover:border-[color:var(--color-accent)]"
              title="Worktree dev server (aynı makinede)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Önizleme (lokal)
            </a>
          )}
          {tunnelUrl && (
            <a
              href={tunnelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs font-medium hover:border-[color:var(--color-accent)]"
              title="Cloudflare tunnel (uzaktan erişim)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Tunnel
            </a>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => setDialog("cancel")}
              disabled={pending || cancelRequested}
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs font-medium text-[color:var(--color-fg)] transition hover:border-rose-500 hover:text-rose-600 disabled:opacity-60 dark:hover:text-rose-300"
            >
              {cancelRequested ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Durduruluyor…
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5" />
                  Durdur
                </>
              )}
            </button>
          )}
          {canDecide && (
            <>
              <button
                type="button"
                onClick={() => setDialog("reject")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/[0.05] px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/[0.1] disabled:opacity-60 dark:text-rose-300"
              >
                <X className="h-3.5 w-3.5" />
                Reddet
              </button>
              <button
                type="button"
                onClick={() => setDialog("approve")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                Onayla & yayına al
              </button>
            </>
          )}
        </div>
        {err && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/[0.06] px-2.5 py-1 text-[11px] text-rose-600 dark:text-rose-300">
            {err}
          </div>
        )}
      </div>

      {/* Custom confirm dialogs */}
      <ConfirmDialog
        open={dialog === "approve"}
        variant="approve"
        title="Onayla ve main'e yayınla"
        description={
          <div className="space-y-2">
            <p>
              Bu değişiklikler <strong>main branch</strong>'e merge edilecek ve
              kalıcı olarak projeye eklenecek.
            </p>
            <ul className="ml-4 list-disc space-y-0.5 text-xs">
              <li>Worktree branch'i main ile birleştirilir</li>
              <li>Önizleme sunucusu ve tunnel kapatılır</li>
              <li>Geçici branch + worktree silinir</li>
            </ul>
          </div>
        }
        confirmLabel="Evet, yayınla"
        pending={pending}
        onConfirm={() => runAction(() => approveAgentTaskAction(id))}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "reject"}
        variant="danger"
        title="Değişiklikleri reddet"
        description={
          <div className="space-y-2">
            <p>
              Bu task <strong>reddedildi</strong> olarak işaretlenecek ve
              değişiklikler atılacak. Geri alınamaz.
            </p>
            <ul className="ml-4 list-disc space-y-0.5 text-xs">
              <li>Hiçbir değişiklik main'e gitmez</li>
              <li>Önizleme + tunnel kapatılır</li>
              <li>Worktree + branch tamamen silinir</li>
            </ul>
          </div>
        }
        confirmLabel="Evet, reddet"
        pending={pending}
        onConfirm={() => runAction(() => rejectAgentTaskAction(id))}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "cancel"}
        variant="danger"
        title={status === "PENDING" ? "Sıradaki task'ı iptal et" : "Çalışan task'ı durdur"}
        description={
          status === "PENDING" ? (
            <p>
              Bu task henüz başlamadan sıradan çıkarılacak ve{" "}
              <strong>iptal</strong> olarak işaretlenecek.
            </p>
          ) : (
            <p>
              Agent mevcut adımı bitirir bitirmez duracak. Yapılmış kısmi
              değişiklikler atılır, worktree silinir.
            </p>
          )
        }
        confirmLabel="Evet, durdur"
        pending={pending}
        onConfirm={() => runAction(() => cancelAgentTaskAction(id))}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
