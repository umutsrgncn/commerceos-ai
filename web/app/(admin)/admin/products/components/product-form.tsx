"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/lib/actions/products";
import { formatMinorUnits } from "@/lib/schemas/products";
import { AiDescribeButton } from "./ai-describe-button";
import { ImageUploader } from "./image-uploader";

type Category = { id: string; name: string };

type Mode =
  | { mode: "create" }
  | {
      mode: "edit";
      product: {
        id: string;
        name: string;
        slug: string;
        sku: string;
        description: string | null;
        price: number;
        costPrice: number | null;
        currency: string;
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        categoryId: string | null;
        images?: string[];
      };
    };

type Props = Mode & { categories: Category[] };

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
          ? "Oluşturuluyor..."
          : "Kaydediliyor..."
        : mode === "create"
          ? "Ürünü oluştur"
          : "Değişiklikleri kaydet"}
    </Button>
  );
}

export function ProductForm(props: Props) {
  const isEdit = props.mode === "edit";
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    action,
    null
  );

  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const initial = isEdit ? props.product : null;
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Genel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ürün adı</Label>
              <Input
                ref={nameRef}
                id="name"
                name="name"
                defaultValue={initial?.name}
                required
                placeholder="Örnek: Premium Pamuklu T-Shirt"
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={initial?.slug}
                  placeholder="otomatik oluşur"
                />
                <FieldError messages={state?.fieldErrors?.slug} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  ref={skuRef}
                  id="sku"
                  name="sku"
                  defaultValue={initial?.sku}
                  required
                  placeholder="ABC-123"
                  className="font-mono uppercase"
                />
                <FieldError messages={state?.fieldErrors?.sku} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <AiDescribeButton
                  getInput={() => ({
                    name: nameRef.current?.value ?? "",
                    sku: skuRef.current?.value,
                    category:
                      props.categories.find((c) => c.id === categoryRef.current?.value)
                        ?.name ?? null,
                  })}
                  onResult={(text) => {
                    if (descriptionRef.current) {
                      descriptionRef.current.value = text;
                    }
                  }}
                />
              </div>
              <Textarea
                ref={descriptionRef}
                id="description"
                name="description"
                rows={8}
                defaultValue={initial?.description ?? ""}
                placeholder="Ürün hakkında 1-2 paragraf. Hedef müşteri, malzeme, kullanım önerileri..."
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Görseller</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              name="images"
              initial={initial?.images ?? []}
              aiInput={() => ({
                name: nameRef.current?.value ?? "",
                description: descriptionRef.current?.value ?? null,
                category:
                  props.categories.find(
                    (c) => c.id === categoryRef.current?.value
                  )?.name ?? null,
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fiyatlandırma</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Satış fiyatı</Label>
              <Input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                defaultValue={initial ? formatMinorUnits(initial.price) : ""}
                required
                placeholder="0.00"
              />
              <FieldError messages={state?.fieldErrors?.price} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costPrice">Maliyet (opsiyonel)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="text"
                inputMode="decimal"
                defaultValue={
                  initial?.costPrice != null
                    ? formatMinorUnits(initial.costPrice)
                    : ""
                }
                placeholder="0.00"
              />
              <FieldError messages={state?.fieldErrors?.costPrice} />
              <p className="text-xs text-[color:var(--color-muted)]">
                Brüt kâr marjı için
              </p>
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
          </CardContent>
          {isEdit && initial?.costPrice != null && initial.costPrice > 0 && (
            <CardContent className="border-t border-[color:var(--color-border)] pt-4">
              <MarginPreview
                price={initial.price}
                costPrice={initial.costPrice}
                currency={initial.currency}
              />
            </CardContent>
          )}
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Başlangıç stoğu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="initialQuantity">Adet</Label>
                <Input
                  id="initialQuantity"
                  name="initialQuantity"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Yayın</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Durum</Label>
              <Select id="status" name="status" defaultValue={initial?.status ?? "DRAFT"}>
                <option value="DRAFT">Taslak</option>
                <option value="PUBLISHED">Yayında</option>
                <option value="ARCHIVED">Arşiv</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Kategori</Label>
              <Select
                ref={categoryRef}
                id="categoryId"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— Yok —</option>
                {props.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {state?.error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SubmitButton mode={isEdit ? "edit" : "create"} />
          <Link href="/admin/products" className="w-full">
            <Button type="button" variant="ghost" className="w-full">
              İptal
            </Button>
          </Link>
        </div>
      </aside>
    </form>
  );
}

function MarginPreview({
  price,
  costPrice,
  currency,
}: {
  price: number;
  costPrice: number;
  currency: string;
}) {
  const profit = price - costPrice;
  const marginPct = price > 0 ? (profit / price) * 100 : 0;
  const tone =
    marginPct < 0
      ? "text-red-500"
      : marginPct < 20
        ? "text-amber-500"
        : "text-emerald-500";

  return (
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Brüt kâr
        </div>
        <div className={cn("mt-0.5 font-mono text-base font-semibold tabular-nums", tone)}>
          {formatMoney(profit, currency)}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Marj
        </div>
        <div className={cn("mt-0.5 font-mono text-base font-semibold tabular-nums", tone)}>
          %{marginPct.toFixed(1)}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendingUp className={cn("h-4 w-4", tone)} />
        <span className="text-[color:var(--color-muted)]">
          {marginPct < 0
            ? "Maliyetin altında"
            : marginPct < 20
              ? "Düşük marj"
              : marginPct < 40
                ? "Orta marj"
                : "Yüksek marj"}
        </span>
      </div>
    </div>
  );
}
