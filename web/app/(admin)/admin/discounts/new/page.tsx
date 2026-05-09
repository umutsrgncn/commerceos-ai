import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DiscountForm } from "../components/discount-form";

export const metadata = { title: "Yeni indirim — CommerceOS" };

export default function NewDiscountPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/discounts"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> İndirimler
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni indirim</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Tip seçince ilgili değer alanı görünür.
        </p>
      </div>
      <DiscountForm />
    </div>
  );
}
