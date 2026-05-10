import {
  Building2,
  Receipt,
  Settings as SettingsIcon,
} from "lucide-react";

import { getSettings } from "@/lib/queries/settings";
import { SettingsForm } from "./components/settings-form";
import { GibForm } from "./components/gib-form";

export const metadata = { title: "Ayarlar — CommerceOS" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-indigo-500/[0.06] via-fuchsia-500/[0.04] to-emerald-500/[0.04] px-6 py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mağaza ayarları</h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Şirket bilgisi e-fatura ve fişlerde görünür. GİB e-fatura
            entegrasyonu test modunda otomatik çalışır; üretime almak için
            entegratör bilgisi girmen yeterli.
          </p>
        </div>
      </div>

      <Section
        icon={<Building2 className="h-4 w-4 text-indigo-500" />}
        title="Şirket bilgileri"
        description="Bu bilgiler tüm fatura, fiş ve resmi belgelerde görünür."
      >
        <SettingsForm
          initial={{
            companyName: settings.companyName,
            taxId: settings.taxId,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            defaultCurrency: settings.defaultCurrency,
            defaultTaxRate: settings.defaultTaxRate,
            timezone: settings.timezone,
          }}
        />
      </Section>

      <Section
        icon={<Receipt className="h-4 w-4 text-emerald-500" />}
        title="GİB E-Fatura Entegrasyonu"
        description="Test modunda lokal mock yanıt; üretimde kendi entegratörüne gerçek HTTP isteği gönderilir."
      >
        <GibForm
          initial={{
            gibMode: settings.gibMode,
            gibIntegratorUrl: settings.gibIntegratorUrl,
            gibUsername: settings.gibUsername,
            gibPasswordEncrypted: settings.gibPasswordEncrypted,
            gibSenderAlias: settings.gibSenderAlias,
          }}
        />
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color:var(--color-fg)]/[0.04]">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-[color:var(--color-muted)]">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}
