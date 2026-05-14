"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, CreditCard, Lock, ShieldCheck, XCircle } from "lucide-react";

import {
  submitMockPaymentAction,
  type CheckoutActionState,
} from "@/lib/shop/checkout";
import { cn } from "@/lib/cn";

const TEST_CARDS = [
  {
    label: "Başarılı ödeme",
    number: "4111 1111 1111 1111",
    holder: "TEST KART",
    expiry: "12/28",
    cvv: "123",
    tone: "success" as const,
    description: "Onaylanır",
  },
  {
    label: "Kart reddedildi",
    number: "4000 0000 0000 0002",
    holder: "TEST KART",
    expiry: "12/28",
    cvv: "123",
    tone: "danger" as const,
    description: "Banka reddeder",
  },
  {
    label: "Yetersiz bakiye",
    number: "4000 0000 0000 0119",
    holder: "TEST KART",
    expiry: "12/28",
    cvv: "123",
    tone: "warn" as const,
    description: "Bakiye hatası",
  },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function SubmitBtn({ total }: { total: number }) {
  const { pending } = useFormStatus();
  const tlText = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(total / 100);
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-accent)] px-6 py-4 text-sm font-semibold text-[color:var(--color-accent-fg)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Lock className="h-4 w-4" />
      {pending ? "İşleniyor…" : `${tlText} ödemeyi tamamla`}
    </button>
  );
}

export function MockPosForm({ total }: { total: number }) {
  const [state, formAction] = useActionState<CheckoutActionState, FormData>(
    submitMockPaymentAction,
    null,
  );

  const [card, setCard] = useState({
    number: "",
    holder: "",
    expiry: "",
    cvv: "",
  });

  function applyTestCard(idx: number) {
    const t = TEST_CARDS[idx];
    setCard({
      number: t.number,
      holder: t.holder,
      expiry: t.expiry,
      cvv: t.cvv,
    });
  }

  const last4 = card.number.replace(/\s/g, "").slice(-4);
  const displayNumber = card.number || "•••• •••• •••• ••••";
  const displayHolder = card.holder || "AD SOYAD";
  const displayExpiry = card.expiry || "MM/YY";

  return (
    <form action={formAction} className="space-y-6">
      {/* Görsel kart — preview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--color-fg)] via-[color:var(--color-fg)]/95 to-[color:var(--color-accent)] p-6 text-[color:var(--color-bg)] shadow-2xl shadow-black/30">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[color:var(--color-cognac)]/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-12 place-items-center rounded-md bg-gradient-to-br from-amber-300 to-amber-600">
              {/* chip */}
              <div className="h-3 w-6 rounded-sm border border-amber-900/40" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-80">
              PayTR
            </span>
          </div>
          <div className="mt-7 font-mono text-2xl tracking-[0.18em]">
            {displayNumber}
          </div>
          <div className="mt-5 flex items-end justify-between text-[10px] uppercase tracking-wider">
            <div>
              <div className="opacity-60">Kart sahibi</div>
              <div className="mt-1 font-mono text-sm normal-case tracking-wide">
                {displayHolder}
              </div>
            </div>
            <div>
              <div className="opacity-60">Son kullanma</div>
              <div className="mt-1 font-mono text-sm tracking-wide">
                {displayExpiry}
              </div>
            </div>
          </div>
          {last4.length === 4 && (
            <p className="mt-3 text-[10px] opacity-70">
              Kart son 4 hane: <strong>{last4}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Form alanları */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-[color:var(--color-accent)]" />
          Kart bilgileri
        </h3>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
              Kart numarası <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardNumber"
              required
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4111 1111 1111 1111"
              value={card.number}
              onChange={(e) =>
                setCard((c) => ({
                  ...c,
                  number: formatCardNumber(e.target.value),
                }))
              }
              className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 font-mono text-sm tracking-wide placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            />
            <FieldErr msgs={state?.fieldErrors?.cardNumber} />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
              Kart sahibi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardHolder"
              required
              autoComplete="cc-name"
              placeholder="AD SOYAD"
              value={card.holder}
              onChange={(e) =>
                setCard((c) => ({
                  ...c,
                  holder: e.target.value.toUpperCase(),
                }))
              }
              className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            />
            <FieldErr msgs={state?.fieldErrors?.cardHolder} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                Son kullanma <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cardExpiry"
                required
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    expiry: formatExpiry(e.target.value),
                  }))
                }
                className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 font-mono text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
              />
              <FieldErr msgs={state?.fieldErrors?.cardExpiry} />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                CVV <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cardCvv"
                required
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={card.cvv}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                className="mt-1.5 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2.5 font-mono text-sm placeholder:text-[color:var(--color-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
              />
              <FieldErr msgs={state?.fieldErrors?.cardCvv} />
            </div>
          </div>
        </div>
      </div>

      {/* Test kartları */}
      <div className="rounded-2xl border-2 border-dashed border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/[0.04] p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[color:var(--color-accent)]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-accent)]">
            Test kartları · tek tıkla doldur
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {TEST_CARDS.map((t, i) => (
            <button
              key={t.number}
              type="button"
              onClick={() => applyTestCard(i)}
              className={cn(
                "rounded-lg border bg-[color:var(--color-bg)] p-3 text-left transition hover:shadow-md",
                t.tone === "success" &&
                  "border-emerald-500/40 hover:border-emerald-500",
                t.tone === "danger" &&
                  "border-red-500/40 hover:border-red-500",
                t.tone === "warn" &&
                  "border-amber-500/40 hover:border-amber-500",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                  t.tone === "success" && "text-emerald-600",
                  t.tone === "danger" && "text-red-500",
                  t.tone === "warn" && "text-amber-600",
                )}
              >
                {t.tone === "success" && <CheckCircle2 className="h-3 w-3" />}
                {t.tone === "danger" && <XCircle className="h-3 w-3" />}
                {t.tone === "warn" && <XCircle className="h-3 w-3" />}
                {t.label}
              </div>
              <div className="mt-2 font-mono text-[11px] tabular-nums">
                {t.number}
              </div>
              <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hata göstergesi */}
      {state?.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-red-600">
            <XCircle className="h-4 w-4" />
            Ödeme başarısız
          </div>
          <p className="mt-1 text-red-700 dark:text-red-400">{state.error}</p>
        </div>
      )}

      <SubmitBtn total={total} />

      <p className="text-center text-[10px] text-[color:var(--color-muted)]">
        Bu bir <strong>PayTR sandbox</strong> akışıdır — gerçek kart bilgisi
        gönderme. Test kartlarıyla akışı simüle eder.
      </p>
    </form>
  );
}

function FieldErr({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>;
}
