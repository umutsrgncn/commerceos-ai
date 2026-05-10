import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSupplierById } from "@/lib/queries/suppliers";
import { SupplierForm } from "../components/supplier-form";

export const metadata = { title: "Tedarikçi — CommerceOS" };

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

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
          {supplier.name}
        </h1>
        {supplier.contactPerson && (
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            İlgili: {supplier.contactPerson}
          </p>
        )}
      </div>

      <SupplierForm
        mode="edit"
        initial={{
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          contactPerson: supplier.contactPerson,
          address: supplier.address,
          notes: supplier.notes,
          productSkus: supplier.productSkus,
          leadTimeDays: supplier.leadTimeDays,
          isActive: supplier.isActive,
        }}
      />
    </div>
  );
}
