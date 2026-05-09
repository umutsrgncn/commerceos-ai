import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCustomers } from "@/lib/queries/customers";
import { formatRelativeTime } from "@/lib/format";

export const metadata = { title: "Müşteriler — CommerceOS" };

const PAGE_SIZE = 20;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { items, total } = await listCustomers({
    q: params.q,
    page,
    pageSize: PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Müşteriler</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {total} kayıt — sipariş geçmişiyle birlikte
          </p>
        </div>
        <Link href="/admin/customers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yeni müşteri
          </Button>
        </Link>
      </div>

      <form action="/admin/customers" className="max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Ad, e-posta veya telefon ara"
            className="pl-9"
          />
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Müşteri</th>
                    <th className="px-4 py-3 text-left font-medium">Telefon</th>
                    <th className="px-4 py-3 text-right font-medium">Sipariş</th>
                    <th className="px-4 py-3 text-right font-medium">Eklendi</th>
                    <th className="px-4 py-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-[color:var(--color-muted)]">
                          {c.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {c.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c._count.orders}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(c.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/customers/${c.id}`}>
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
                href={`/admin/customers?${new URLSearchParams({
                  ...(params.q ? { q: params.q } : {}),
                  page: String(page - 1),
                }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Önceki
                </Button>
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={`/admin/customers?${new URLSearchParams({
                  ...(params.q ? { q: params.q } : {}),
                  page: String(page + 1),
                }).toString()}`}
              >
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-2xl">
        🧑
      </div>
      <h3 className="text-base font-semibold">Henüz müşteri yok</h3>
      <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
        Müşteri ekledikçe sipariş geçmişleri burada birikecek.
      </p>
      <Link href="/admin/customers/new" className="mt-2">
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Yeni müşteri
        </Button>
      </Link>
    </div>
  );
}
