"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { registerAction } from "@/lib/shop/auth-actions";
import type { AuthActionState } from "@/lib/shop/auth";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Kayıt oluşturuluyor…" : "Hesap oluştur"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function FieldErr({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>;
}

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <Field
        label="Ad Soyad"
        name="name"
        type="text"
        required
        placeholder="Ayşe Demir"
        errs={state?.fieldErrors?.name}
      />
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="ornek@mail.com"
        errs={state?.fieldErrors?.email}
      />
      <Field
        label="Telefon (opsiyonel)"
        name="phone"
        type="tel"
        placeholder="0532 ..."
        errs={state?.fieldErrors?.phone}
      />
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="En az 8 karakter"
        errs={state?.fieldErrors?.password}
      />

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {state.error}
        </div>
      )}

      <p className="text-[10px] text-[color:var(--color-muted)] leading-relaxed">
        Kayıt olarak <strong>KVKK aydınlatma metnini</strong> okuduğunu ve
        kişisel verilerinin işlenmesini kabul ettiğini onaylamış olursun.
      </p>

      <SubmitBtn />
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  placeholder,
  autoComplete,
  errs,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  errs?: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
      />
      <FieldErr msgs={errs} />
    </div>
  );
}
