"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";

import { iterateAgentTaskAction } from "@/lib/agent/actions";

export function FeedbackForm({ id }: { id: string }) {
  const [feedback, setFeedback] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;
    setErr(null);
    const text = feedback;
    start(async () => {
      const r = await iterateAgentTaskAction(id, text);
      if (!r.ok) {
        setErr(r.error ?? "Hata");
        return;
      }
      setFeedback("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] via-[color:var(--color-bg)] to-[color:var(--color-bg)] p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquarePlus className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
        Yeni talimat ver
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        Beğenmediğin bir şey varsa veya küçük bir değişiklik istersen, agent
        mevcut worktree'de devam edip düzenleme yapar (sıfırdan başlamaz).
      </p>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Örn: Buton rengi turuncu yerine kırmızı olsun. Onay modalında ek bir 'iptal sebebim' alanı ekle…"
        className="mt-3 block w-full resize-y rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20"
      />

      {err && (
        <div className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/[0.06] px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-300">
          {err}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] tabular-nums text-[color:var(--color-muted)]/60">
          {feedback.length} / 2000
        </span>
        <button
          type="submit"
          disabled={pending || feedback.trim().length < 5}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Gönderiliyor…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Agent'a gönder
            </>
          )}
        </button>
      </div>
    </form>
  );
}
