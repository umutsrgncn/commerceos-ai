"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddressDraft = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  // Billing-only
  isCompany?: boolean;
  taxId?: string;
  taxOffice?: string;
};

export const EMPTY_ADDRESS: AddressDraft = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "TR",
};

export function AddressFields({
  prefix,
  value,
  onChange,
  showCompanyFields = false,
  disabled = false,
}: {
  prefix: "ship" | "bill";
  value: AddressDraft;
  onChange: (v: AddressDraft) => void;
  showCompanyFields?: boolean;
  disabled?: boolean;
}) {
  function patch<K extends keyof AddressDraft>(k: K, v: AddressDraft[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : undefined}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${prefix}.fullName`}>Ad Soyad / Firma adı *</Label>
          <Input
            id={`${prefix}.fullName`}
            name={`${prefix}.fullName`}
            value={value.fullName}
            onChange={(e) => patch("fullName", e.target.value)}
            placeholder="Ahmet Yılmaz"
            required={!disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}.phone`}>Telefon</Label>
          <Input
            id={`${prefix}.phone`}
            name={`${prefix}.phone`}
            value={value.phone}
            onChange={(e) => patch("phone", e.target.value)}
            placeholder="+90 555 ..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}.country`}>Ülke</Label>
          <Input
            id={`${prefix}.country`}
            name={`${prefix}.country`}
            value={value.country}
            onChange={(e) => patch("country", e.target.value)}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${prefix}.line1`}>Adres satırı 1 *</Label>
          <Input
            id={`${prefix}.line1`}
            name={`${prefix}.line1`}
            value={value.line1}
            onChange={(e) => patch("line1", e.target.value)}
            placeholder="Mahalle, sokak, kapı no"
            required={!disabled}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${prefix}.line2`}>Adres satırı 2</Label>
          <Input
            id={`${prefix}.line2`}
            name={`${prefix}.line2`}
            value={value.line2}
            onChange={(e) => patch("line2", e.target.value)}
            placeholder="Bina, daire, kat"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}.city`}>İl *</Label>
          <Input
            id={`${prefix}.city`}
            name={`${prefix}.city`}
            value={value.city}
            onChange={(e) => patch("city", e.target.value)}
            placeholder="İstanbul"
            required={!disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}.district`}>İlçe</Label>
          <Input
            id={`${prefix}.district`}
            name={`${prefix}.district`}
            value={value.district}
            onChange={(e) => patch("district", e.target.value)}
            placeholder="Kadıköy"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}.postalCode`}>Posta kodu</Label>
          <Input
            id={`${prefix}.postalCode`}
            name={`${prefix}.postalCode`}
            value={value.postalCode}
            onChange={(e) => patch("postalCode", e.target.value)}
            placeholder="34710"
          />
        </div>
      </div>

      {showCompanyFields && (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-[color:var(--color-border)] p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={`${prefix}.isCompany`}
              checked={!!value.isCompany}
              onChange={(e) => patch("isCompany", e.target.checked)}
              className="h-4 w-4 accent-fuchsia-500"
            />
            Kurumsal fatura (e-fatura)
          </label>
          {value.isCompany && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${prefix}.taxId`}>VKN / TCKN</Label>
                <Input
                  id={`${prefix}.taxId`}
                  name={`${prefix}.taxId`}
                  value={value.taxId ?? ""}
                  onChange={(e) => patch("taxId", e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${prefix}.taxOffice`}>Vergi dairesi</Label>
                <Input
                  id={`${prefix}.taxOffice`}
                  name={`${prefix}.taxOffice`}
                  value={value.taxOffice ?? ""}
                  onChange={(e) => patch("taxOffice", e.target.value)}
                  placeholder="Kadıköy"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
