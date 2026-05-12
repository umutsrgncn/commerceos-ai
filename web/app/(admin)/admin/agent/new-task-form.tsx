"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { createAgentTaskAction, type CreateState } from "@/lib/agent/actions";

const PRESETS = [
  "Shop footer'a 'Hediye kartı' linki ekle, sayfaya bir placeholder içerik koy.",
  "Shop kategori sayfasındaki ürün kartlarına 'Yeni' rozeti ekle (son 30 günde eklenenler).",
  "Admin dashboard'una toplam favori sayısını gösteren bir StatTile ekle.",
];

export function NewAgentTaskForm() {
  const [state, formAction] = useActionState<CreateState, FormData>(
    createAgentTaskAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
        Yeni task
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        Ne istediğini net yaz. Agent dosyaları kendi keşfeder.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="title"
            className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
          >
            Başlık <span className="text-rose-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Kısa, net bir özet"
            className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
          />
        </div>
        <div>
          <label
            htmlFor="prompt"
            className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
          >
            Ne yapsın? <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={4}
            maxLength={4000}
            placeholder="Örn: Shop ana sayfaya 'En çok satanlar' bölümü ekle, son 30 günde en çok satılan 8 ürünü göster."
            className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm placeholder:text-[color:var(--color-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  const form = (e.target as HTMLElement).closest("form");
                  if (!form) return;
                  const ta = form.querySelector<HTMLTextAreaElement>("textarea[name=prompt]");
                  const ti = form.querySelector<HTMLInputElement>("input[name=title]");
                  if (ta) ta.value = p;
                  if (ti && !ti.value) ti.value = p.slice(0, 60);
                }}
                className="rounded-full border border-[color:var(--color-border)] px-2.5 py-0.5 text-[10px] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-fg)]"
              >
                {p.slice(0, 40)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {state && !state.ok && (
        <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
          {state.error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-[color:var(--color-muted)]">
          Scope: shop + admin UI · agent prisma/auth'a dokunmaz
        </p>
        <SubmitButton />
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
      className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-fg)] px-4 py-2 text-sm font-medium text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Kaydediliyor…
        </>
      ) : (
        <>
          Task'ı başlat
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}
