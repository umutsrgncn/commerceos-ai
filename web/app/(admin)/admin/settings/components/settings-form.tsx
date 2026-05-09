"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateSettingsAction,
  type SettingsActionState,
} from "@/lib/actions/settings";

type Settings = {
  companyName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  defaultCurrency: string;
  defaultTaxRate: number;
  timezone: string;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Kaydediliyor..." : saved ? <><Check className="h-4 w-4" /> Kaydedildi</> : "Kaydet"}
    </Button>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    updateSettingsAction,
    null
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Şirket bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="companyName">Firma adı</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={initial.companyName}
                required
              />
              <FieldError messages={state?.fieldErrors?.companyName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxId">Vergi numarası</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={initial.taxId ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">İletişim e-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initial.email ?? ""}
              />
              <FieldError messages={state?.fieldErrors?.email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initial.phone ?? ""}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={initial.address ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mağaza varsayılanları</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultCurrency">Para birimi</Label>
              <Select
                id="defaultCurrency"
                name="defaultCurrency"
                defaultValue={initial.defaultCurrency}
              >
                <option value="TRY">TRY ₺</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="defaultTaxRate">Varsayılan vergi (0-1)</Label>
              <Input
                id="defaultTaxRate"
                name="defaultTaxRate"
                inputMode="decimal"
                defaultValue={String(initial.defaultTaxRate)}
              />
              <FieldError messages={state?.fieldErrors?.defaultTaxRate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Saat dilimi</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={initial.timezone}
              />
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
        {state?.ok && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
            Ayarlar güncellendi.
          </div>
        )}
        <SubmitButton saved={!!state?.ok} />
      </aside>
    </form>
  );
}
