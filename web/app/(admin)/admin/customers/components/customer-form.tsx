"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerActionState,
} from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null;

type Props =
  | { mode: "create" }
  | {
      mode: "edit";
      customer: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        notes: string | null;
        address: Address;
      };
    };

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
          ? "Ekleniyor..."
          : "Kaydediliyor..."
        : mode === "create"
          ? "Müşteriyi ekle"
          : "Değişiklikleri kaydet"}
    </Button>
  );
}

export function CustomerForm(props: Props) {
  const isEdit = props.mode === "edit";
  const action = isEdit ? updateCustomerAction : createCustomerAction;
  const [state, formAction] = useActionState<CustomerActionState, FormData>(
    action,
    null
  );

  const initial = isEdit ? props.customer : null;
  const addr = initial?.address ?? null;

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>İletişim</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" name="name" defaultValue={initial?.name} required />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initial?.email}
                required
              />
              <FieldError messages={state?.fieldErrors?.email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={initial?.phone ?? ""}
                placeholder="+90 555 000 00 00"
              />
              <FieldError messages={state?.fieldErrors?.phone} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adres</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address.line1">Adres satır 1</Label>
              <Input
                id="address.line1"
                name="address.line1"
                defaultValue={addr?.line1 ?? ""}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address.line2">Adres satır 2</Label>
              <Input
                id="address.line2"
                name="address.line2"
                defaultValue={addr?.line2 ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address.city">Şehir</Label>
              <Input
                id="address.city"
                name="address.city"
                defaultValue={addr?.city ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address.state">İl/Eyalet</Label>
              <Input
                id="address.state"
                name="address.state"
                defaultValue={addr?.state ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address.postalCode">Posta kodu</Label>
              <Input
                id="address.postalCode"
                name="address.postalCode"
                defaultValue={addr?.postalCode ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address.country">Ülke</Label>
              <Input
                id="address.country"
                name="address.country"
                defaultValue={addr?.country ?? "Türkiye"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              rows={4}
              defaultValue={initial?.notes ?? ""}
              placeholder="Tercihler, özel talepler, kısa hatırlatmalar..."
            />
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
        <Link href="/admin/customers" className="block">
          <Button type="button" variant="ghost" className="w-full">
            İptal
          </Button>
        </Link>
      </aside>
    </form>
  );
}
