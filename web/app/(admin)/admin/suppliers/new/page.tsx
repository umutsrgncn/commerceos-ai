import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SupplierForm } from "../components/supplier-form";

export const metadata = { title: "Yeni tedarikçi — CommerceOS" };

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/suppliers"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Tedarikçiler
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Yeni tedarikçi
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          SKU'larını da gir — Otopilot stok düşünce direkt mail gönderebilsin.
        </p>
      </div>

      <SupplierForm mode="create" />
    </div>
  );
}
