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
  const router = useRouter();

  const canDecide = status === "REVIEW";
  const canCancel =
    status === "PENDING" ||
    status === "PLANNING" ||
    status === "RUNNING" ||
    status === "TESTING";

  function approve() {
    setErr(null);
    start(async () => {
      const r = await approveAgentTaskAction(id);
      if (!r.ok) setErr(r.error);
      router.refresh();
    });
  }
  function reject() {
    setErr(null);
    if (!confirm("Bu task reddedilecek, branch ve worktree silinecek. Emin misin?")) return;
    start(async () => {
      const r = await rejectAgentTaskAction(id);
      if (!r.ok) setErr(r.error);
      router.refresh();
    });
  }
  function cancel() {
    setErr(null);
    const msg =
      status === "PENDING"
        ? "Sıradaki bu task iptal edilecek. Emin misin?"
        : "Çalışan task durdurulacak. Mevcut adım bitince agent çıkacak. Emin misin?";
    if (!confirm(msg)) return;
    start(async () => {
      const r = await cancelAgentTaskAction(id);
      if (!r.ok) setErr(r.error);
      router.refresh();
    });
  }

  return (
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
            onClick={cancel}
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
              onClick={reject}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/[0.05] px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-500/[0.1] disabled:opacity-60 dark:text-rose-300"
            >
              <X className="h-3.5 w-3.5" />
              Reddet
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
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
  );
}
