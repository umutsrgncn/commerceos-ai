import Link from "next/link";
import { ArrowLeft, FileUp } from "lucide-react";

import { CsvImportClient } from "../components/csv-import-client";
import { getSettings } from "@/lib/queries/settings";

export const metadata = { title: "Banka extresi yükle — CommerceOS" };

export default async function BankImportPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bank"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Banka işlemleri
      </Link>

      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-emerald-500/[0.06] via-indigo-500/[0.04] to-fuchsia-500/[0.04] px-6 py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-500 text-white shadow-md">
          <FileUp className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Banka extresi yükle
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            CSV dosyasını yükle, kolonları eşleştir, AI otomatik olarak
            havaleleri siparişlerle eşleştirsin (≥85% güven). Belirsiz olanlar
            manuel onay için listelenir.
          </p>
        </div>
      </div>

      <CsvImportClient
        defaultBankName={settings.bankName ?? "Test Bankası"}
        defaultIban={settings.bankAccountIban ?? ""}
      />
    </div>
  );
}
