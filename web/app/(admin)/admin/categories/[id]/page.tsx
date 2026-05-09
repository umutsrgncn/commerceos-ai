import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderTree, Package, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCategoryById,
  listCategoryTree,
} from "@/lib/queries/categories";
import { deleteCategoryAction } from "@/lib/actions/categories";
import { EditCategoryForm } from "../components/edit-form";

export const metadata = { title: "Kategori — CommerceOS" };

function flatten(tree: Awaited<ReturnType<typeof listCategoryTree>>) {
  const out: { id: string; name: string }[] = [];
  function visit(
    node: (typeof tree)[number],
    prefix: string
  ) {
    const label = prefix ? `${prefix} › ${node.name}` : node.name;
    out.push({ id: node.id, name: label });
    for (const child of node.children) visit(child, label);
  }
  for (const root of tree) visit(root, "");
  return out;
}

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, tree] = await Promise.all([
    getCategoryById(id),
    listCategoryTree(),
  ]);
  if (!category) notFound();

  const parents = flatten(tree);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/categories"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Kategoriler
        </Link>

        <form action={deleteCategoryAction}>
          <input type="hidden" name="id" value={category.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
          {category.parent ? (
            <Link
              href={`/admin/categories/${category.parent.id}`}
              className="hover:text-[color:var(--color-fg)] hover:underline"
            >
              {category.parent.name}
            </Link>
          ) : (
            <span>Kök seviye</span>
          )}
          <span>›</span>
          <span className="font-mono">{category.slug}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            {category.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SmallStat
          icon={<Package className="h-4 w-4" />}
          label="Doğrudan ürün"
          value={String(category._count.products)}
        />
        <SmallStat
          icon={<FolderTree className="h-4 w-4" />}
          label="Alt kategori"
          value={String(category.children.length)}
        />
        <SmallStat
          icon={<Package className="h-4 w-4" />}
          label="Alt kategori ürün"
          value={String(
            category.children.reduce((s, c) => s + c._count.products, 0)
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bilgi</CardTitle>
            <CardDescription>Ad, slug, üst kategori ve açıklama</CardDescription>
          </CardHeader>
          <CardContent>
            <EditCategoryForm
              initial={{
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parentId: category.parentId,
              }}
              parents={parents}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {category.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alt kategoriler</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[color:var(--color-border)]">
                  {category.children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/categories/${c.id}`}
                        className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[color:var(--color-fg)]/[0.025]"
                      >
                        <span className="font-medium">{c.name}</span>
                        <Badge variant="neutral">{c._count.products} ürün</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {category.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ürünler</CardTitle>
                <CardDescription>Son 20 — güncellendiğine göre</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[color:var(--color-border)]">
                  {category.products.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[color:var(--color-fg)]/[0.025]"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="font-mono text-xs text-[color:var(--color-muted)]">
                            {p.sku}
                          </div>
                        </div>
                        <Badge
                          variant={
                            p.status === "PUBLISHED"
                              ? "success"
                              : p.status === "DRAFT"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {p.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
          {icon}
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
            {label}
          </div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
