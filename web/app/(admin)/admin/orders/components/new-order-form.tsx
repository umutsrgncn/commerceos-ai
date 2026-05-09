"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrderAction, type OrderActionState } from "@/lib/actions/orders";
import { formatMoney } from "@/lib/format";

export type CustomerOption = { id: string; name: string; email: string };
export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  inventory: { quantity: number } | null;
};

type Line = { productId: string; quantity: number };

export function NewOrderForm({
  customers,
  products,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [state, formAction] = useActionState<OrderActionState, FormData>(
    createOrderAction,
    null
  );
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [taxRate, setTaxRate] = useState("0");
  const [shipping, setShipping] = useState("0");

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const currency = lines.reduce<string | null>((cur, line) => {
    const p = productMap.get(line.productId);
    if (!p) return cur;
    if (cur && cur !== p.currency) return cur;
    return p.currency;
  }, null);

  const subtotal = lines.reduce((sum, line) => {
    const p = productMap.get(line.productId);
    if (!p) return sum;
    return sum + p.price * line.quantity;
  }, 0);
  const taxMinor = Math.round(subtotal * (Number(taxRate) || 0));
  const shippingMinor = Math.round((Number(shipping) || 0) * 100);
  const total = subtotal + taxMinor + shippingMinor;

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="taxRate" value={taxRate} />
      <input type="hidden" name="shipping" value={Math.round((Number(shipping) || 0) * 100)} />
      {lines.map((line, idx) => (
        <input
          key={idx}
          type="hidden"
          name={`items[${idx}].productId`}
          value={line.productId}
          />
      ))}
      {lines.map((line, idx) => (
        <input
          key={`q-${idx}`}
          type="hidden"
          name={`items[${idx}].quantity`}
          value={line.quantity}
        />
      ))}

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Müşteri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="customerId">Sipariş kime?</Label>
              <Select id="customerId" name="customerId" required defaultValue="">
                <option value="" disabled>
                  Müşteri seç…
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.email}
                  </option>
                ))}
              </Select>
              {state?.fieldErrors?.customerId && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.customerId[0]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kalemler</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLines((prev) => [...prev, { productId: "", quantity: 1 }])
              }
            >
              <Plus className="h-4 w-4" /> Satır ekle
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((line, idx) => {
              const p = productMap.get(line.productId);
              const lineTotal = p ? p.price * line.quantity : 0;
              return (
                <div key={idx} className="grid grid-cols-12 gap-3">
                  <div className="col-span-7">
                    <Select
                      value={line.productId}
                      onChange={(e) =>
                        updateLine(idx, { productId: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Ürün seç…
                      </option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku}) —{" "}
                          {formatMoney(prod.price, prod.currency)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2 self-center text-right text-sm tabular-nums">
                    {p ? formatMoney(lineTotal, p.currency) : "—"}
                  </div>
                  <div className="col-span-1 self-center text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setLines((prev) =>
                          prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)
                        )
                      }
                      aria-label="Satırı sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              rows={3}
              placeholder="Müşteriye özel notlar, kargo talimatı…"
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Vergi oranı (örn. 0.20)</Label>
              <Input
                id="taxRate"
                inputMode="decimal"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shipping">Kargo (₺)</Label>
              <Input
                id="shipping"
                inputMode="decimal"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              />
            </div>

            <div className="space-y-1 border-t border-[color:var(--color-border)] pt-3 text-sm">
              <Row label="Ara toplam" value={currency ? formatMoney(subtotal, currency) : "—"} />
              {taxMinor > 0 && currency && (
                <Row label="Vergi" value={formatMoney(taxMinor, currency)} />
              )}
              {shippingMinor > 0 && currency && (
                <Row label="Kargo" value={formatMoney(shippingMinor, currency)} />
              )}
              <div className="flex items-center justify-between border-t border-[color:var(--color-border)] pt-2 text-base font-semibold">
                <span>Toplam</span>
                <span className="tabular-nums">
                  {currency ? formatMoney(total, currency) : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {state?.error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SubmitButton />
          <Link href="/admin/orders">
            <Button type="button" variant="ghost" className="w-full">
              İptal
            </Button>
          </Link>
        </div>
      </aside>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sipariş açılıyor..." : "Sipariş aç"}
    </Button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[color:var(--color-muted)]">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
