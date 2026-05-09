"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createDiscountAction,
  updateDiscountAction,
  type DiscountActionState,
} from "@/lib/actions/discounts";

type DiscountInitial = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number;
  maxRedemptions: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

type Props = { mode: "create" } | { mode: "edit"; initial: DiscountInitial };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === "create"
          ? "Kaydediliyor..."
          : "Güncelleniyor..."
        : mode === "create"
          ? "Kodu kaydet"
          : "Değişiklikleri kaydet"}
    </Button>
  );
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  // YYYY-MM-DDTHH:mm — local time (input element expects no timezone info).
  const tz = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

export function DiscountForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;
  const action = isEdit ? updateDiscountAction : createDiscountAction;
  const [state, formAction] = useActionState<DiscountActionState, FormData>(
    action,
    null
  );
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(
    initial?.type ?? "PERCENTAGE"
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Kod</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Kod</Label>
              <Input
                id="code"
                name="code"
                required={!isEdit}
                defaultValue={initial?.code}
                disabled={isEdit}
                placeholder="SUMMER25"
                className="font-mono uppercase"
              />
              {isEdit && (
                <p className="text-xs text-[color:var(--color-muted)]">
                  Kod sabittir, değiştirilemez.
                </p>
              )}
              <FieldError messages={state?.fieldErrors?.code} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tip</Label>
              <Select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                <option value="PERCENTAGE">Yüzde (%)</option>
                <option value="FIXED">Sabit tutar (₺)</option>
              </Select>
            </div>

            {type === "PERCENTAGE" ? (
              <div className="space-y-1.5">
                <Label htmlFor="percentValue">Yüzde değeri</Label>
                <Input
                  id="percentValue"
                  name="percentValue"
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  defaultValue={
                    initial?.type === "PERCENTAGE" ? initial.value : 10
                  }
                  required
                />
                <FieldError messages={state?.fieldErrors?.percentValue} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="fixedValue">İndirim tutarı (₺)</Label>
                <Input
                  id="fixedValue"
                  name="fixedValue"
                  inputMode="decimal"
                  required
                  defaultValue={
                    initial?.type === "FIXED"
                      ? (initial.value / 100).toFixed(2)
                      : ""
                  }
                  placeholder="50.00"
                />
                <FieldError messages={state?.fieldErrors?.fixedValue} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="minSubtotal">Min. sepet (₺, opsiyonel)</Label>
              <Input
                id="minSubtotal"
                name="minSubtotal"
                inputMode="decimal"
                defaultValue={
                  initial ? (initial.minSubtotal / 100).toFixed(2) : "0"
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={initial?.description ?? ""}
                placeholder="Yaz tatili kampanyası, vb."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geçerlilik</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Başlangıç</Label>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(initial?.startsAt ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endsAt">Bitiş</Label>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(initial?.endsAt ?? null)}
              />
              <FieldError messages={state?.fieldErrors?.endsAt} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptions">Maks. kullanım</Label>
              <Input
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min={1}
                defaultValue={initial?.maxRedemptions ?? ""}
                placeholder="Sınırsız için boş bırak"
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={initial?.isActive ?? true}
                className="h-4 w-4 accent-[color:var(--color-accent)]"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-3">
        {state?.error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {state.error}
          </div>
        )}
        <SubmitButton mode={isEdit ? "edit" : "create"} />
        <Link href="/admin/discounts" className="block">
          <Button type="button" variant="ghost" className="w-full">
            İptal
          </Button>
        </Link>
      </aside>
    </form>
  );
}
