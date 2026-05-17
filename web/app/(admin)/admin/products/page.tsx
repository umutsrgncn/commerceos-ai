import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductThumb } from "@/components/products/product-thumb";
import { listProducts } from "@/lib/queries/products";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import type { ProductStatusValue } from "@/lib/schemas/products";

import { CsvDownloadButton } from "./components/csv-download-button";
import { ProductsFilters } from "./components/products-filters";
import { StatusBadge } from "./components/status-badge";

export const metadata = { title: "Ürünler — CommerceOS" };

const PAGE_SIZE = 20;

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === "DRAFT" || params.status === "PUBLISHED" || params.status === "ARCHIVED"
      ? (params.status as ProductStatusValue)
      : undefined;

  const { items, total } = await listProducts({
    q: params.q,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Ürünler</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Kataloğun tek noktada — yeni ekle, düzenle, AI ile açıklama yazdır.
          </p>
        </div>
        <div className="flex gap-3">
          <CsvDownloadButton q={params.q} status={status} />
          <Link href="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni ürün
            </Button>
          </Link>
        </div>
      </div>

      <ProductsFilters />

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="themed-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Ürün</th>
                    <th className="px-4 py-3 text-left font-medium">SKU</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-right font-medium">Fiyat</th>
                    <th className="px-4 py-3 text-right font-medium">Stok</th>
                    <th className="px-4 py-3 text-right font-medium">Güncellendi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb
                            images={product.images}
                            alt={product.name}
                            className="h-10 w-10"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="block truncate font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <div className="text-xs text-[color:var(--color-muted)]">
                                {product.category.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-muted)]">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(product.price, product.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {product.inventory?.quantity ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(product.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <Pagination currentPage={page} pageCount={pageCount} params={params} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
        <Package className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">Henüz ürün yok</h3>
      <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
        İlk ürününü ekle. AI&apos;dan açıklama yazmasını isteyebilirsin.
      </p>
      <Link href="/admin/products/new" className="mt-2">
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Yeni ürün
        </Button>
      </Link>
    </div>
  );
}

function Pagination({
  currentPage,
  pageCount,
  params,
}: {
  currentPage: number;
  pageCount: number;
  params: SearchParams;
}) {
  const buildUrl = (page: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status) sp.set("status", params.status);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[color:var(--color-muted)]">
        Sayfa {currentPage} / {pageCount}
      </span>
      <div className="flex gap-2">
        {currentPage > 1 && (
          <Link href={buildUrl(currentPage - 1)}>
            <Button variant="outline" size="sm">
              Önceki
            </Button>
          </Link>
        )}
        {currentPage < pageCount && (
          <Link href={buildUrl(currentPage + 1)}>
            <Button variant="outline" size="sm">
              Sonraki
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
