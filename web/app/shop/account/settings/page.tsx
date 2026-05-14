import { Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";

import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/shop/auth";
import { DeleteAccountSection } from "./delete-account-section";

export const metadata = { title: "Ayarlar · Pamuk" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const customer = await requireCustomer();

  // Müşterinin en güncel KVKK silme talebi — duplicate engellemek + state göstermek için
  const activeRequest = await db.dataDeletionRequest.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      reason: true,
      createdAt: true,
      reviewedAt: true,
      reviewNote: true,
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl italic">Ayarlar</h1>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Profil bilgilerini ve hesap tercihlerini yönet.
        </p>
      </header>

      {/* Profil */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          <UserIcon className="h-3.5 w-3.5" />
          Profil
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <ProfileField icon={UserIcon} label="Ad Soyad" value={customer.name} />
          <ProfileField icon={Mail} label="E-posta" value={customer.email} mono />
          {customer.phone && (
            <ProfileField icon={Phone} label="Telefon" value={customer.phone} />
          )}
        </dl>
        <p className="mt-5 text-[11px] leading-relaxed text-[color:var(--color-muted)]">
          Profil düzenleme arayüzü yakında. Şu an siparişlerinde girdiğin son
          bilgiler kullanılır.
        </p>
      </section>

      {/* KVKK — hesabı sil */}
      <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="flex items-start gap-3 border-b border-[color:var(--color-border)] bg-gradient-to-br from-rose-500/[0.05] via-amber-500/[0.03] to-transparent px-6 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">KVKK · Verilerim</h2>
            <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
              6698 sayılı kanun m.11 — hesabını ve kişisel verilerini silme hakkın.
            </p>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <DeleteAccountSection
            customer={{ id: customer.id, email: customer.email, name: customer.name }}
            activeRequest={
              activeRequest
                ? {
                    id: activeRequest.id,
                    status: activeRequest.status,
                    reason: activeRequest.reason,
                    createdAt: activeRequest.createdAt.toISOString(),
                    reviewedAt: activeRequest.reviewedAt
                      ? activeRequest.reviewedAt.toISOString()
                      : null,
                    reviewNote: activeRequest.reviewNote,
                  }
                : null
            }
          />
        </div>
      </section>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/40 p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          {label}
        </dt>
        <dd className={`mt-0.5 truncate font-medium ${mono ? "font-mono text-xs" : "text-sm"}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}
