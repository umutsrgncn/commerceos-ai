import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProductById, listCategoriesFlat } from "@/lib/queries/products";
import { deleteProductAction } from "@/lib/actions/products";
import { ProductForm } from "../components/product-form";

export const metadata = { title: "Ürün — CommerceOS" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategoriesFlat(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Ürünler
        </Link>

        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          SKU <span className="font-mono">{product.sku}</span>
        </p>
      </div>

      <ProductForm
        mode="edit"
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          price: product.price,
          currency: product.currency,
          status: product.status,
          categoryId: product.categoryId,
        }}
      />
    </div>
  );
}
