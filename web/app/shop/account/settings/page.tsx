import { Settings as SettingsIcon } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";

export const metadata = { title: "Ayarlar · Pamuk" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const customer = await requireCustomer();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl italic">Ayarlar</h1>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Profil bilgilerini ve hesap tercihlerini yönet.
        </p>
      </header>

      {/* Profil özet */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          <SettingsIcon className="h-3.5 w-3.5" />
          Profil
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Ad Soyad
            </dt>
            <dd className="mt-1 font-medium">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              E-posta
            </dt>
            <dd className="mt-1 font-mono text-xs">{customer.email}</dd>
          </div>
          {customer.phone && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Telefon
              </dt>
              <dd className="mt-1 font-medium">{customer.phone}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 text-[11px] text-[color:var(--color-muted)]">
          Profil düzenleme arayüzü ileride eklenecek. Şu an siparişlerde
          girdiğin son bilgiler kullanılır.
        </p>
      </section>

      {/* KVKK */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          KVKK — Verilerim
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
          KVKK kapsamında kişisel verilerinin silinmesi veya kopyasını isteme
          hakkın var. Bu işlem mağaza yönetiminde 7 gün içinde tamamlanır.
        </p>
        <p className="mt-4 text-[11px] text-[color:var(--color-muted)]">
          Talep için: <strong>kvkk@pamuktekstil.com</strong>
        </p>
      </section>
    </div>
  );
}
