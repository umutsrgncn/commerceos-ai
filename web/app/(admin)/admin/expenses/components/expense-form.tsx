"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Calendar, Loader2, Receipt, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseActionState,
} from "@/lib/actions/expenses";
import { categorizeExpenseAction } from "@/lib/actions/finance-ai";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { cn } from "@/lib/cn";

type Initial = {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  category: ExpenseCategoryValue;
  description: string;
  vendor: string | null;
  reference: string | null;
};

type Props = { mode: "create" } | { mode: "edit"; initial: Initial };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending
        ? mode === "create"
          ? "Ekleniyor..."
          : "Kaydediliyor..."
        : mode === "create"
          ? "Gideri kaydet"
          : "Değişiklikleri kaydet"}
    </Button>
  );
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ExpenseForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;
  const action = isEdit ? updateExpenseAction : createExpenseAction;
  const [state, formAction] = useActionState<ExpenseActionState, FormData>(
    action,
    null
  );

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const vendorRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ExpenseCategoryValue>(
    initial?.category ?? "OTHER"
  );
  const [aiPending, setAiPending] = useState(false);
  const [aiHint, setAiHint] = useState<{
    category: string;
    confidence: number;
    reasoning: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState(
    initial ? (initial.amount / 100).toFixed(2) : ""
  );

  async function suggestCategory() {
    setAiError(null);
    setAiHint(null);
    const desc = descriptionRef.current?.value ?? "";
    if (desc.trim().length < 2) {
      setAiError("Önce açıklama yaz.");
      return;
    }
    setAiPending(true);
    const res = await categorizeExpenseAction(
      desc,
      vendorRef.current?.value || null
    );
    setAiPending(false);
    if (!res.ok) {
      setAiError(res.error);
      return;
    }
    setAiHint({
      category: res.category,
      confidence: res.confidence,
      reasoning: res.reasoning,
    });
    if (
      res.confidence >= 60 &&
      (EXPENSE_CATEGORIES as readonly string[]).includes(res.category)
    ) {
      setCategory(res.category as ExpenseCategoryValue);
    }
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-500" />
              Gider detayı
            </CardTitle>
            <CardDescription>
              Açıklama yaz, sonra <strong>AI ile kategorile</strong> butonuna
              bas — kategori + güven skoru otomatik gelir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                ref={descriptionRef}
                id="description"
                name="description"
                required
                rows={2}
                defaultValue={initial?.description ?? ""}
                placeholder="Mart 2026 dükkân kirası, ARAS kargo gönderim ücreti, vb."
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vendor">Tedarikçi</Label>
                <Input
                  ref={vendorRef}
                  id="vendor"
                  name="vendor"
                  defaultValue={initial?.vendor ?? ""}
                  placeholder="ARAS Kargo, Vodafone, Migros"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference">Belge no (opsiyonel)</Label>
                <Input
                  id="reference"
                  name="reference"
                  defaultValue={initial?.reference ?? ""}
                  placeholder="Fatura no, fiş no"
                />
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
                  AI ile kategorile
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={suggestCategory}
                  disabled={aiPending}
                >
                  {aiPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Düşünüyor...
                    </>
                  ) : (
                    "Kategori öner"
                  )}
                </Button>
              </div>
              {aiError && (
                <p className="mt-2 text-xs text-red-500">{aiError}</p>
              )}
              {aiHint && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                      {EXPENSE_CATEGORY_LABELS[
                        aiHint.category as ExpenseCategoryValue
                      ] ?? aiHint.category}
                    </span>
                    <ConfidenceBar value={aiHint.confidence} />
                    {aiHint.confidence >= 60 && (
                      <span className="text-[color:var(--color-muted)]">
                        ✓ otomatik seçildi
                      </span>
                    )}
                  </div>
                  {aiHint.reasoning && (
                    <p className="text-[color:var(--color-muted)]">
                      {aiHint.reasoning}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Tutar ve sınıflandırma
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Tutar</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.amount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Para birimi</Label>
              <Select
                id="currency"
                name="currency"
                defaultValue={initial?.currency ?? "TRY"}
              >
                <option value="TRY">TRY ₺</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date" className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Tarih
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={
                  initial
                    ? toDateInputValue(initial.date)
                    : toDateInputValue(new Date())
                }
              />
              <FieldError messages={state?.fieldErrors?.date} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Select
                id="category"
                name="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ExpenseCategoryValue)
                }
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
              {aiHint && aiHint.confidence >= 60 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  AI önerisi uygulandı
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-3 self-start lg:sticky lg:top-20">
        {state?.error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {state.error}
          </div>
        )}

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
            Önizleme
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {amountInput
              ? `${Number(amountInput || 0).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} ₺`
              : "0,00 ₺"}
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
            {EXPENSE_CATEGORY_LABELS[category]}
          </div>
        </div>

        <SubmitButton mode={isEdit ? "edit" : "create"} />
        <Link href="/admin/expenses" className="block">
          <Button type="button" variant="ghost" className="w-full">
            İptal
          </Button>
        </Link>
      </aside>
    </form>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const tone =
    value >= 70
      ? "bg-emerald-500"
      : value >= 40
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1 w-12 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.08]">
        <span
          className={cn("block h-full rounded-full", tone)}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-[10px] tabular-nums text-[color:var(--color-muted)]">
        %{value}
      </span>
    </span>
  );
}
