import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

import { getSettings } from "@/lib/queries/settings";
import { KvkkForm } from "./components/kvkk-form";

export const metadata = { title: "KVKK Ayarları — CommerceOS" };

export default async function KvkkSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ayarlara dön
        </Link>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-indigo-500/[0.06] via-fuchsia-500/[0.04] to-emerald-500/[0.04] px-4 py-4 sm:px-6 sm:py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            KVKK Uyumluluğu
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            6698 sayılı kanun kapsamında çerez bildirimi, aydınlatma metni ve
            DPO bilgisi yönetimi. AI ile şirket bilgilerinden uyumlu metin üret.
          </p>
        </div>
      </div>

      <KvkkForm
        initial={{
          cookieBannerEnabled: settings.cookieBannerEnabled,
          dataController: settings.dataController,
          dpoEmail: settings.dpoEmail,
          privacyPolicyText: settings.privacyPolicyText,
          privacyPolicyUpdatedAt: settings.privacyPolicyUpdatedAt,
        }}
      />
    </div>
  );
}
