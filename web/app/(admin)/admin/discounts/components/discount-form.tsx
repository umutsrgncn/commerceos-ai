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
  type DiscountActionState,
} from "@/lib/actions/discounts";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Kaydediliyor..." : "Kodu kaydet"}
    </Button>
  );
}

export function DiscountForm() {
  const [state, formAction] = useActionState<DiscountActionState, FormData>(
    createDiscountAction,
    null
  );
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                required
                placeholder="SUMMER25"
                className="font-mono uppercase"
              />
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
                  defaultValue={10}
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
                defaultValue="0"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
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
              <Input id="startsAt" name="startsAt" type="datetime-local" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endsAt">Bitiş</Label>
              <Input id="endsAt" name="endsAt" type="datetime-local" />
              <FieldError messages={state?.fieldErrors?.endsAt} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptions">Maks. kullanım</Label>
              <Input
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min={1}
                placeholder="Sınırsız için boş bırak"
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked
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
        <SubmitButton />
        <Link href="/admin/discounts" className="block">
          <Button type="button" variant="ghost" className="w-full">
            İptal
          </Button>
        </Link>
      </aside>
    </form>
  );
}
