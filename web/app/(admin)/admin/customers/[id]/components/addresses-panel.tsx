"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createCustomerAddressAction,
  deleteCustomerAddressAction,
  type AddressActionState,
} from "@/lib/actions/addresses";

type SavedAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  isCompany: boolean;
  taxId: string | null;
  taxOffice: string | null;
  isDefault: boolean;
};

const initial: AddressActionState = null;

export function AddressesPanel({
  customerId,
  addresses,
}: {
  customerId: string;
  addresses: SavedAddress[];
}) {
  const [state, action, pending] = useActionState(
    createCustomerAddressAction,
    initial,
  );
  const [open, setOpen] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [removing, startRemove] = useTransition();
  const [removeId, setRemoveId] = useState<string | null>(null);

  function remove(id: string) {
    if (!confirm("Bu adresi silmek istediğine emin misin?")) return;
    setRemoveId(id);
    startRemove(async () => {
      await deleteCustomerAddressAction(id);
      setRemoveId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Adresler</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          {open ? "İptal" : "Yeni adres"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.length === 0 && !open && (
          <p className="text-xs text-[color:var(--color-muted)]">
            Henüz adres yok. Sipariş açarken adres pre-fill için en az bir
            tane ekle.
          </p>
        )}

        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--color-border)] p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                {a.isCompany ? (
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span className="font-medium">{a.label ?? a.city}</span>
                {a.isDefault && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Varsayılan
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-fg)]/85">
                {a.fullName} · {a.phone ?? "—"}
              </div>
              <div className="text-xs text-[color:var(--color-muted)]">
                {a.line1}
                {a.line2 && `, ${a.line2}`}
              </div>
              <div className="text-xs text-[color:var(--color-muted)]">
                {[a.district, a.city, a.postalCode].filter(Boolean).join(" / ")}
              </div>
              {a.isCompany && a.taxId && (
                <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                  VKN: {a.taxId}
                  {a.taxOffice && ` · ${a.taxOffice} VD`}
                </div>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(a.id)}
              disabled={removing && removeId === a.id}
              aria-label="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {open && (
          <form
            action={action}
            className="space-y-3 rounded-lg border border-dashed border-[color:var(--color-border)] p-3"
          >
            <input type="hidden" name="customerId" value={customerId} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="label">Etiket</Label>
                <Input id="label" name="label" placeholder="Ev / İş" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="country">Ülke</Label>
                <Input id="country" name="country" defaultValue="TR" />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="line1">Adres satırı 1 *</Label>
                <Input id="line1" name="line1" required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="line2">Adres satırı 2</Label>
                <Input id="line2" name="line2" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="city">İl *</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" name="district" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postalCode">Posta kodu</Label>
                <Input id="postalCode" name="postalCode" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                name="isCompany"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="h-3.5 w-3.5 accent-fuchsia-500"
              />
              Kurumsal fatura adresi
            </label>

            {isCompany && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="taxId">VKN/TCKN</Label>
                  <Input id="taxId" name="taxId" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taxOffice">Vergi dairesi</Label>
                  <Input id="taxOffice" name="taxOffice" />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                name="isDefault"
                className="h-3.5 w-3.5 accent-fuchsia-500"
              />
              Varsayılan adres olarak işaretle
            </label>

            {state?.error && (
              <p className="text-xs text-red-500">{state.error}</p>
            )}

            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Ekleniyor..." : "Adresi kaydet"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
