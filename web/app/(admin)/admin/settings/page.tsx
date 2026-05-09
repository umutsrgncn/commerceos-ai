import { getSettings } from "@/lib/queries/settings";
import { SettingsForm } from "./components/settings-form";

export const metadata = { title: "Ayarlar — CommerceOS" };

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mağaza ayarları</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Şirket bilgisi faturada görünür. Para birimi ve vergi varsayılanları
          yeni ürün/sipariş formlarına önerilir.
        </p>
      </div>

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
    </div>
  );
}
