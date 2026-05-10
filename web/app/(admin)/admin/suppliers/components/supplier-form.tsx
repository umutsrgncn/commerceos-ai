"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  type SupplierActionResult,
} from "@/lib/actions/suppliers";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Initial = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  address: string | null;
  notes: string | null;
  productSkus: string[];
  leadTimeDays: number | null;
  isActive: boolean;
};

type Props = { mode: "create" } | { mode: "edit"; initial: Initial };

export function SupplierForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  function submit(formData: FormData) {
    setFeedback(null);
    start(async () => {
      let r: SupplierActionResult;
      if (isEdit && initial) {
        formData.set("id", initial.id);
        r = await updateSupplierAction(formData);
      } else {
        r = await createSupplierAction(formData);
      }
      if (!r.ok) {
        const firstFieldErr = r.fieldErrors
          ? Object.values(r.fieldErrors)[0]?.[0]
          : null;
        setFeedback({
          ok: false,
          message: firstFieldErr ?? r.error ?? "Hata",
        });
        return;
      }
      router.push("/admin/suppliers");
    });
  }

  function remove() {
    if (!isEdit || !initial) return;
    if (!confirm("Bu tedarikçi silinsin mi?")) return;
    start(async () => {
      const fd = new FormData();
      fd.set("id", initial.id);
      await deleteSupplierAction(fd);
      router.push("/admin/suppliers");
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Firma adı *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name}
              placeholder="Acme Tekstil A.Ş."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPerson">İlgili kişi</Label>
            <Input
              id="contactPerson"
              name="contactPerson"
              defaultValue={initial?.contactPerson ?? ""}
              placeholder="Ahmet Yılmaz"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
              placeholder="siparis@acme.com.tr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initial?.phone ?? ""}
              placeholder="+90 212 555 00 00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leadTimeDays">Tahmini teslim (gün)</Label>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              type="number"
              min={0}
              defaultValue={initial?.leadTimeDays ?? 7}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={initial?.address ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sağlanan SKU'lar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="productSkus">SKU listesi</Label>
            <Textarea
              id="productSkus"
              name="productSkus"
              rows={4}
              defaultValue={initial?.productSkus.join("\n") ?? ""}
              placeholder="TSHIRT-RED-M&#10;HOODIE-BLACK-L&#10;CAP-WHITE"
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-[color:var(--color-muted)]">
              Satır, virgül veya boşluk ile ayır. Otopilot stok düştüğünde bu
              listede SKU'su olan tedarikçiyi bulup mail atar.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initial?.notes ?? ""}
              placeholder="Minimum sipariş 100 adet, peşin %5 indirim, vb."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={initial?.isActive ?? true}
              className="h-4 w-4 accent-[color:var(--color-accent)]"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Aktif (Otopilot bu tedarikçiyi kullanabilir)
            </Label>
          </div>
        </CardContent>
      </Card>

      {feedback && !feedback.ok && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {feedback.message}
        </div>
      )}

      <div className="sticky bottom-0 -mx-2 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-bg)]/70">
        <p className="text-xs text-[color:var(--color-muted)]">
          {isEdit
            ? "Değişiklikler kaydedildikten sonra otopilot yeni veriyi kullanır."
            : "Eklendikten sonra otopilot uygun stok olayında bu tedarikçiyi seçebilir."}
        </p>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={remove}
              disabled={pending}
            >
              Sil
            </Button>
          )}
          <Link href="/admin/suppliers">
            <Button type="button" size="sm" variant="ghost">
              İptal
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={pending}>
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </form>
  );
}
