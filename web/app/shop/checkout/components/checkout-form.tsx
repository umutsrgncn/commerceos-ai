"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, MapPin, Truck, User } from "lucide-react";

import {
  submitCheckoutStepOneAction,
  type CheckoutActionState,
} from "@/lib/shop/checkout";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-4 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "İlerleniyor…" : "Ödemeye geç"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function CheckoutForm({
  subtotal,
  shippingThreshold,
  shippingCosts,
}: {
  subtotal: number;
  shippingThreshold: number;
  shippingCosts: { standard: number; express: number };
}) {
  const [state, formAction] = useActionState<CheckoutActionState, FormData>(
    submitCheckoutStepOneAction,
    null,
  );
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  const freeShipping = subtotal >= shippingThreshold;
  const shippingFee = freeShipping ? 0 : shippingCosts[shipping];

  return (
    <form action={formAction} className="space-y-8">
      {/* ── Kişi bilgisi ── */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h3 className="flex items-center gap-2 font-display text-2xl italic">
          <User className="h-5 w-5 text-[color:var(--color-accent)]" />
          Kişi
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad" name="fullName" required placeholder="Ayşe Demir" errs={state?.fieldErrors?.fullName} />
          <Field label="E-posta" name="email" type="email" required placeholder="ornek@mail.com" errs={state?.fieldErrors?.email} />
          <div className="sm:col-span-2">
            <Field label="Telefon" name="phone" type="tel" required placeholder="0532 ..." errs={state?.fieldErrors?.phone} />
          </div>
        </div>
      </section>

      {/* ── Adres ── */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h3 className="flex items-center gap-2 font-display text-2xl italic">
          <MapPin className="h-5 w-5 text-[color:var(--color-accent)]" />
          Teslimat adresi
        </h3>

        <div className="mt-5 grid gap-4">
          <Field label="Adres" name="line1" required placeholder="Sokak, No, Bina, Daire" errs={state?.fieldErrors?.line1} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Şehir" name="city" required placeholder="İstanbul" errs={state?.fieldErrors?.city} />
            <Field label="İlçe" name="district" placeholder="Beşiktaş" errs={state?.fieldErrors?.district} />
            <Field label="Posta kodu" name="postalCode" placeholder="34349" errs={state?.fieldErrors?.postalCode} />
          </div>
        </div>
      </section>

      {/* ── Kargo seçimi ── */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h3 className="flex items-center gap-2 font-display text-2xl italic">
          <Truck className="h-5 w-5 text-[color:var(--color-accent)]" />
          Kargo
        </h3>

        <div className="mt-5 grid gap-3">
          <ShippingOption
            value="standard"
            current={shipping}
            onChange={setShipping}
            title="Standart"
            detail="2-3 iş günü · Aras Kargo"
            cost={freeShipping ? 0 : shippingCosts.standard}
            freeShipping={freeShipping}
          />
          <ShippingOption
            value="express"
            current={shipping}
            onChange={setShipping}
            title="Ekspres"
            detail="1 iş günü · MNG Aynı Gün"
            cost={freeShipping ? 0 : shippingCosts.express}
            freeShipping={freeShipping}
          />
        </div>
      </section>

      {/* ── KVKK + final ── */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 space-y-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="kvkkAccepted"
            required
            className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent)]"
          />
          <span className="text-xs leading-relaxed text-[color:var(--color-muted)]">
            <Link
              href={"/shop/kvkk" as never}
              className="underline underline-offset-2 hover:text-[color:var(--color-fg)]"
            >
              KVKK aydınlatma metnini
            </Link>{" "}
            okudum, kişisel verilerimin işlenmesini kabul ediyorum.
          </span>
        </label>

        {state?.error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {state.error}
          </div>
        )}

        <SubmitButton />

        <div className="grid grid-cols-3 gap-2 text-[10px] text-[color:var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-[color:var(--color-accent)]" />
            SSL şifreli
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-[color:var(--color-accent)]" />
            14 gün iade
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-[color:var(--color-accent)]" />
            KVKK uyumlu
          </div>
        </div>

        <p className="text-[10px] text-[color:var(--color-muted)] text-center">
          Tahmini kargo: <strong>{shippingFee === 0 ? "Ücretsiz" : `${(shippingFee / 100).toFixed(0)} ₺`}</strong>
        </p>
      </section>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  errs,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  errs?: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
      />
      <FieldError messages={errs} />
    </div>
  );
}

function ShippingOption({
  value,
  current,
  onChange,
  title,
  detail,
  cost,
  freeShipping,
}: {
  value: "standard" | "express";
  current: "standard" | "express";
  onChange: (v: "standard" | "express") => void;
  title: string;
  detail: string;
  cost: number;
  freeShipping: boolean;
}) {
  const isActive = current === value;
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border p-4 transition ${
        isActive
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.04]"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-muted)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name="shippingMethod"
          value={value}
          checked={isActive}
          onChange={() => onChange(value)}
          className="h-4 w-4 accent-[color:var(--color-accent)]"
        />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[11px] text-[color:var(--color-muted)]">{detail}</p>
        </div>
      </div>
      <div className="font-mono tabular-nums text-sm font-semibold">
        {freeShipping || cost === 0 ? (
          <span className="text-[color:var(--color-accent)]">Ücretsiz</span>
        ) : (
          `${(cost / 100).toFixed(0)} ₺`
        )}
      </div>
    </label>
  );
}
