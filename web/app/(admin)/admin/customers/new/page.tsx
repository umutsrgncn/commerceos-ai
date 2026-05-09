import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "../components/customer-form";

export const metadata = { title: "Yeni müşteri — CommerceOS" };

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Müşteriler
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni müşteri</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          İletişim bilgileri ve adres — sipariş açtığında otomatik bağlanır.
        </p>
      </div>
      <CustomerForm mode="create" />
    </div>
  );
}
