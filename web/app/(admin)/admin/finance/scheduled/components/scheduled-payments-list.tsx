"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarClock, Pencil, Plus, Power, Trash2 } from "lucide-react";

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
import { Modal } from "@/components/ui/modal";
import {
  createScheduledPaymentAction,
  deleteScheduledPaymentAction,
  toggleScheduledPaymentAction,
  updateScheduledPaymentAction,
  type ScheduledPaymentActionState,
} from "@/lib/actions/scheduled-payments";
import {
  RECURRENCE_LABELS,
  RECURRENCE_RULES,
  type RecurrenceRuleValue,
} from "@/lib/schemas/scheduled-payments";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Item = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryValue;
  recurrence: RecurrenceRuleValue;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  vendor: string | null;
  notes: string | null;
};

export function ScheduledPaymentsList({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const isOpen = creating || editing != null;

  // Hash "#new-payment" — hem mount'ta hem değişiklikte modali aç
  useEffect(() => {
    if (typeof window === "undefined") return;
    function check() {
      if (window.location.hash === "#new-payment") {
        setEditing(null);
        setCreating(true);
        history.replaceState(null, "", window.location.pathname);
      }
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  function closeModal() {
    setCreating(false);
    setEditing(null);
  }

  return (
    <>
      <Card id="new-payment" className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 bg-[color:var(--color-fg)]/[0.02] border-b border-[color:var(--color-border)]">
          <div>
            <CardTitle>Kayıtlı ödemeler</CardTitle>
            <CardDescription>
              {items.length} kayıt —{" "}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {items.filter((i) => i.active).length} aktif
              </span>
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni ekle
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <CalendarClock className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Henüz kayıtlı ödeme yok</p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                Sağ üstteki <strong>Yeni ekle</strong> butonuyla ilk ödemeni gir.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditing(null);
                  setCreating(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                İlk ödemeyi ekle
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {items.map((it) => (
                <ListRow
                  key={it.id}
                  item={it}
                  onEdit={() => {
                    setCreating(false);
                    setEditing(it);
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isOpen}
        onClose={closeModal}
        title={editing ? `Düzenle: ${editing.name}` : "Yeni planlı ödeme"}
        description={
          editing
            ? "Tutar, vade veya tekrar kuralını güncelleyebilirsin."
            : "Maaş, kira, vergi gibi düzenli ödemeleri kaydet — AI nakit akışında kullanır."
        }
        icon={editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        tone="indigo"
        size="lg"
      >
        <PaymentForm
          // key ile reset — başka kayıt açılınca form sıfırlansın
          key={editing?.id ?? "create"}
          initial={editing}
          onDone={closeModal}
        />
      </Modal>
    </>
  );
}

const CATEGORY_TONES: Record<string, string> = {
  PAYROLL: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
  RENT: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  TAXES: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  UTILITIES: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20",
  SOFTWARE: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  SHIPPING: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
  MARKETING: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/20",
  COGS: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20",
};
function categoryTone(cat: string): string {
  return (
    CATEGORY_TONES[cat] ??
    "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)] border-[color:var(--color-border)]"
  );
}

function ListRow({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const dueLabel =
    item.recurrence === "WEEKLY"
      ? ["Pazar", "Pzt", "Salı", "Çar", "Per", "Cuma", "Cmt"][item.dueDay] ?? `gün ${item.dueDay}`
      : `ayın ${item.dueDay}.'i`;
  return (
    <li
      className={cn(
        "grid grid-cols-12 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[color:var(--color-fg)]/[0.02]",
        !item.active && "opacity-60",
      )}
    >
      {/* Sol: status dot + isim + meta */}
      <div className="col-span-12 sm:col-span-5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "relative grid h-2.5 w-2.5 place-items-center rounded-full",
              item.active ? "bg-emerald-500" : "bg-[color:var(--color-muted)]",
            )}
          >
            {item.active && (
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40" />
            )}
          </span>
          <span className="font-semibold text-sm truncate">{item.name}</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              categoryTone(item.category),
            )}
          >
            {EXPENSE_CATEGORY_LABELS[item.category]}
          </span>
        </div>
        {(item.vendor || item.notes) && (
          <div className="mt-1 ml-5 text-[11px] text-[color:var(--color-muted)] truncate">
            {item.vendor && <span>{item.vendor}</span>}
            {item.vendor && item.notes && " · "}
            {item.notes && <span>{item.notes}</span>}
          </div>
        )}
      </div>

      {/* Ortada: recurrence + tarih */}
      <div className="col-span-6 sm:col-span-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-400">
            {RECURRENCE_LABELS[item.recurrence]}
          </span>
          <span className="text-[10px] text-[color:var(--color-muted)]">{dueLabel}</span>
        </div>
        <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
          Başl. {new Date(item.startDate).toLocaleDateString("tr-TR")}
          {item.endDate && (
            <> · bit. {new Date(item.endDate).toLocaleDateString("tr-TR")}</>
          )}
        </div>
      </div>

      {/* Tutar */}
      <div className="col-span-3 sm:col-span-2 text-right">
        <div className="font-mono tabular-nums text-sm font-semibold">
          {formatMoney(item.amount, item.currency)}
        </div>
        <div className="text-[10px] text-[color:var(--color-muted)]">
          /{RECURRENCE_LABELS[item.recurrence].toLowerCase()}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
        <form action={toggleScheduledPaymentAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            title={item.active ? "Pasifleştir" : "Aktifleştir"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md border transition",
              item.active
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]",
            )}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </form>
        <button
          type="button"
          onClick={onEdit}
          title="Düzenle"
          className="grid h-8 w-8 place-items-center rounded-md border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <form action={deleteScheduledPaymentAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            title="Sil"
            className="grid h-8 w-8 place-items-center rounded-md border border-[color:var(--color-border)] text-red-500 hover:bg-red-500/10 hover:border-red-500/30"
            onClick={(e) => {
              if (!confirm(`"${item.name}" ödemesini sil?`)) e.preventDefault();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </li>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitBtn({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === "create"
          ? "Ekleniyor…"
          : "Kaydediliyor…"
        : mode === "create"
          ? "Ekle"
          : "Kaydet"}
    </Button>
  );
}

function PaymentForm({
  initial,
  onDone,
}: {
  initial: Item | null;
  onDone: () => void;
}) {
  const isEdit = !!initial;
  const [state, formAction] = useActionState<
    ScheduledPaymentActionState,
    FormData
  >(isEdit ? updateScheduledPaymentAction : createScheduledPaymentAction, null);

  const [amount, setAmount] = useState(
    initial ? (initial.amount / 100).toFixed(2) : ""
  );
  const [recurrence, setRecurrence] = useState<RecurrenceRuleValue>(
    initial?.recurrence ?? "MONTHLY"
  );

  return (
    <form action={formAction} className="space-y-3">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ödeme adı</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Personel maaşları, Dükkan kirası…"
          />
          <FieldError messages={state?.fieldErrors?.name} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vendor">Alıcı (opsiyonel)</Label>
          <Input
            id="vendor"
            name="vendor"
            defaultValue={initial?.vendor ?? ""}
            placeholder="Personel, GİB, Aras Kargo…"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="amount">Tutar</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <FieldError messages={state?.fieldErrors?.amount} />
        </div>
        <div className="space-y-1">
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
        <div className="space-y-1">
          <Label htmlFor="category">Kategori</Label>
          <Select
            id="category"
            name="category"
            defaultValue={initial?.category ?? "OTHER"}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="recurrence">Tekrarlama</Label>
          <Select
            id="recurrence"
            name="recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceRuleValue)}
          >
            {RECURRENCE_RULES.map((r) => (
              <option key={r} value={r}>
                {RECURRENCE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dueDay">
            {recurrence === "WEEKLY" ? "Haftanın günü (0=Pzr...6=Cmt)" : "Ayın günü (1-31)"}
          </Label>
          <Input
            id="dueDay"
            name="dueDay"
            type="number"
            min={recurrence === "WEEKLY" ? 0 : 1}
            max={recurrence === "WEEKLY" ? 6 : 31}
            required
            defaultValue={initial?.dueDay ?? 1}
          />
          <FieldError messages={state?.fieldErrors?.dueDay} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startDate">Başlangıç</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={
              initial
                ? new Date(initial.startDate).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10)
            }
          />
          <FieldError messages={state?.fieldErrors?.startDate} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="endDate">Bitiş (opsiyonel)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={
              initial?.endDate
                ? new Date(initial.endDate).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="active">Durum</Label>
          <Select id="active" name="active" defaultValue={initial?.active === false ? "false" : "true"}>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Not (opsiyonel)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
          placeholder="Sözleşme detayı, dikkat noktası…"
        />
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {state.error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SubmitBtn mode={isEdit ? "edit" : "create"} />
        <Button type="button" variant="ghost" onClick={onDone}>
          İptal
        </Button>
        {amount && (
          <span className="ml-auto text-xs text-[color:var(--color-muted)]">
            Önizleme:{" "}
            <strong className="text-[color:var(--color-fg)] tabular-nums">
              {Number(amount || 0).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ₺
            </strong>{" "}
            / {RECURRENCE_LABELS[recurrence].toLowerCase()}
          </span>
        )}
      </div>
    </form>
  );
}
