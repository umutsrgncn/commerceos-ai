import { MapPin } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Adreslerim · Pamuk" };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const customer = await requireCustomer();
  const addresses = await db.customerAddress.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-3xl italic">Adreslerim</h1>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            {addresses.length} kayıtlı adres
          </p>
        </div>
      </header>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]">
            <MapPin className="h-6 w-6" />
          </span>
          <p className="mt-4 font-display text-2xl italic">
            Henüz adresin yok
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            İlk siparişinde girdiğin adres burada saklanacak.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{a.label ?? "Adres"}</p>
                    {a.isDefault && (
                      <span className="inline-block rounded-full bg-[color:var(--color-accent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:var(--color-accent-fg)]">
                        Varsayılan
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs">
                <p className="text-sm font-medium">{a.fullName}</p>
                <p className="text-[color:var(--color-muted)] leading-relaxed">
                  {a.line1}
                  {a.district && <>, {a.district}</>}
                  <br />
                  {a.city}
                  {a.postalCode && <> · {a.postalCode}</>}
                </p>
                {a.phone && (
                  <p className="text-[color:var(--color-muted)]">{a.phone}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[color:var(--color-muted)]">
        İpucu: Ödeme adımında yeni adres eklediğinde otomatik olarak buraya
        kaydedilir.
      </p>
    </div>
  );
}
