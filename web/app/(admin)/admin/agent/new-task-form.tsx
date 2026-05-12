"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Lightbulb, Loader2, Sparkles } from "lucide-react";

import { createAgentTaskAction, type CreateState } from "@/lib/agent/actions";

const PROMPT_MAX = 4000;
const TITLE_MAX = 120;

export function NewAgentTaskForm() {
  const [state, formAction] = useActionState<CreateState, FormData>(
    createAgentTaskAction,
    null,
  );
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");

  const titleLen = title.length;
  const promptLen = prompt.length;
  const promptPercent = Math.min(100, (promptLen / PROMPT_MAX) * 100);

  return (
    <form
      action={formAction}
      className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-accent)]/[0.05] via-[color:var(--color-bg)] to-[color:var(--color-bg)] p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/10 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-base font-semibold">Yeni geliştirme görevi</div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Ne yapmasını istediğini doğal dilde yaz. Agent ilgili dosyaları kendi
              bulur, planlar, uygular ve onayına sunar.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="title"
                className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]"
              >
                Başlık <span className="text-rose-500">*</span>
              </label>
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  titleLen > TITLE_MAX - 10
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[color:var(--color-muted)]/60"
                }`}
              >
                {titleLen} / {TITLE_MAX}
              </span>
            </div>
            <input
              id="title"
              name="title"
              required
              maxLength={TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kısa, net özet (örn: Footer'a sosyal medya ikonları ekle)"
              className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm font-medium placeholder:font-normal placeholder:text-[color:var(--color-muted)]/60 focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20"
            />
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="prompt"
                className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]"
              >
                Detaylar <span className="text-rose-500">*</span>
              </label>
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  promptLen > PROMPT_MAX - 200
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[color:var(--color-muted)]/60"
                }`}
              >
                {promptLen} / {PROMPT_MAX}
              </span>
            </div>
            <textarea
              id="prompt"
              name="prompt"
              required
              rows={7}
              maxLength={PROMPT_MAX}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Mesela:

• Hangi sayfada / bileşende?
• Ne eklensin / kaldırılsın / değişsin?
• Görsel bir referans varsa (renk, konum, davranış)
• Edge case'ler

Net yaz, ama uzun olmasından çekinme — agent her şeyi okur.`}
              className="mt-1.5 block w-full resize-y rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 font-mono text-[13px] leading-relaxed placeholder:font-normal placeholder:text-[color:var(--color-muted)]/40 focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20"
            />
            {/* Progress bar */}
            <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.05]">
              <div
                className={`h-full transition-all ${
                  promptPercent > 90
                    ? "bg-rose-500"
                    : promptPercent > 70
                    ? "bg-amber-500"
                    : "bg-[color:var(--color-accent)]"
                }`}
                style={{ width: `${promptPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hints row */}
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-[11px] leading-relaxed text-[color:var(--color-fg)]/80">
            <strong>İpucu:</strong> Agent <code className="rounded bg-[color:var(--color-fg)]/[0.06] px-1 py-0.5 font-mono text-[10px]">/shop</code> ve admin UI dosyalarına yazabilir.{" "}
            <code className="rounded bg-[color:var(--color-fg)]/[0.06] px-1 py-0.5 font-mono text-[10px]">prisma</code>, auth, db.ts, .env dokunulmaz.
            Yeni paket isteyen veya schema değiştiren işleri planlama aşamasında reddeder.
          </div>
        </div>

        {state && !state.ok && (
          <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
            {state.error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[color:var(--color-muted)]">
            Aynı anda yalnız bir task çalışır. Bekleyenler sıraya alınır.
          </p>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-fg)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-bg)] shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Kaydediliyor…
        </>
      ) : (
        <>
          Task'ı başlat
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
