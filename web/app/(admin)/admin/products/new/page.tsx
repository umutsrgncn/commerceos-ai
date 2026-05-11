import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategoryOptions } from "@/lib/queries/categories";
import { ProductForm } from "../components/product-form";

export const metadata = { title: "Yeni ürün — CommerceOS" };

export default async function NewProductPage() {
  const categories = await listCategoryOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Ürünler
        </Link>
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Yeni ürün</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Temel bilgileri gir, AI&apos;dan açıklama isteyebilirsin.
        </p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
