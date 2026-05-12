"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { loginAction } from "@/lib/shop/auth-actions";
import type { AuthActionState } from "@/lib/shop/auth";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function FieldErr({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>;
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="email"
          className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
        >
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ornek@mail.com"
          className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
        />
        <FieldErr msgs={state?.fieldErrors?.email} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
        >
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
        />
        <FieldErr msgs={state?.fieldErrors?.password} />
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {state.error}
        </div>
      )}

      <SubmitBtn />
    </form>
  );
}
