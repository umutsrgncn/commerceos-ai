import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "../components/expense-form";

export const metadata = { title: "Yeni gider — CommerceOS" };

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/expenses"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Giderler
      </Link>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Yeni gider</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Tarih, kategori, tutar ve kısa açıklama yeterli.
        </p>
      </div>
      <ExpenseForm mode="create" />
    </div>
  );
}
