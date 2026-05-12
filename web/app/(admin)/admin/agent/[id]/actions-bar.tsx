"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import type { AgentTaskStatus } from "@prisma/client";

import {
  approveAgentTaskAction,
  rejectAgentTaskAction,
} from "@/lib/agent/actions";

export function ActionsBar({
  id,
  status,
  tunnelUrl,
}: {
  id: string;
  status: AgentTaskStatus;
  tunnelUrl: string | null;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const canDecide = status === "REVIEW";

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

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {tunnelUrl && (
          <a
            href={tunnelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs font-medium hover:border-[color:var(--color-accent)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Önizlemeyi aç
          </a>
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
