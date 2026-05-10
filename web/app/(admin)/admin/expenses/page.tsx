import Link from "next/link";
import { Eye, Plus, Wallet } from "lucide-react";
import type { ExpenseCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listExpenses } from "@/lib/queries/expenses";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Giderler — CommerceOS" };

const PAGE_SIZE = 30;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = (
    EXPENSE_CATEGORIES as readonly string[]
  ).includes(params.category ?? "")
    ? (params.category as ExpenseCategoryValue)
    : undefined;

  const data = await listExpenses({
    q: params.q,
    category: category as ExpenseCategory | undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giderler</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {data.total} kayıt · toplam {formatMoney(data.sum, "TRY")}
          </p>
        </div>
        <Link href="/admin/expenses/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yeni gider
          </Button>
        </Link>
      </div>

      {/* Kategori filtre */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
        <Link
          href="/admin/expenses"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition",
            !category
              ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
              : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
          )}
        >
          Tümü
        </Link>
        {EXPENSE_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/admin/expenses?category=${c}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              category === c
                ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            )}
          >
            {EXPENSE_CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <Wallet className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">Henüz gider yok</h3>
              <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
                Mağazana ait kira, kargo, pazarlama gibi giderleri kaydet —
                kâr/zarar raporu otomatik hesaplanır.
              </p>
              <Link href="/admin/expenses/new" className="mt-2">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  İlk gideri ekle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Tarih</th>
                    <th className="px-4 py-3 text-left font-medium">Kategori</th>
                    <th className="px-4 py-3 text-left font-medium">Açıklama</th>
                    <th className="px-4 py-3 text-left font-medium">Tedarikçi</th>
                    <th className="px-4 py-3 text-right font-medium">Tutar</th>
                    <th className="px-4 py-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-4 py-3 text-xs text-[color:var(--color-muted)]">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[color:var(--color-fg)]/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                          {EXPENSE_CATEGORY_LABELS[e.category]}
                        </span>
                      </td>
                      <td className="max-w-md truncate px-4 py-3">
                        {e.description}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {e.vendor ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatMoney(e.amount, e.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/expenses/${e.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" />
                            Düzenle
                          </Button>
                        </Link>
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-[color:var(--color-muted)]">
            Sayfa {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/expenses?${new URLSearchParams({
                  ...(category ? { category } : {}),
                  page: String(page - 1),
                }).toString()}`}
              >
                <Button variant="outline" size="sm">Önceki</Button>
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={`/admin/expenses?${new URLSearchParams({
                  ...(category ? { category } : {}),
                  page: String(page + 1),
                }).toString()}`}
              >
                <Button variant="outline" size="sm">Sonraki</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
