import { CheckCircle2, Trash2 } from "lucide-react";

import { DeletionRequestForm } from "./components/deletion-request-form";

export const metadata = { title: "Veri Silme Talebi — KVKK" };

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const submitted = params.submitted === "1";

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
          <Trash2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Veri Silme Talebi
          </h1>
          <p className="text-xs text-[color:var(--color-muted)]">
            KVKK m.11 — kişisel verilerinizin silinmesini talep edebilirsiniz.
          </p>
        </div>
      </header>

      {submitted ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-medium">Talebiniz alındı.</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              30 gün içinde e-posta adresinize geri dönüş yapılacak. Vergi
              mevzuatı gereği saklanması zorunlu olan belgeler (fatura kayıtları
              vb.) ilgili sürelerin sonuna kadar tutulur.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-[color:var(--color-muted)]">
            Talebiniz değerlendirilecek ve 30 gün içinde size dönüş yapılacaktır.
            Vergi mevzuatı gereği saklanması zorunlu kayıtlar (faturalar)
            korunur.
          </p>
          <DeletionRequestForm />
        </>
      )}
    </article>
  );
}
