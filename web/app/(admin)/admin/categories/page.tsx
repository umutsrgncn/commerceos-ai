import { FolderOpen, FolderTree, Layers, Package } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import {
  listCategoryOptions,
  listCategoryTree,
} from "@/lib/queries/categories";
import { cn } from "@/lib/cn";
import { CategoryTree } from "./components/category-tree";
import { CreateCategoryForm } from "./components/create-form";

export const metadata = { title: "Kategoriler — CommerceOS" };

export default async function CategoriesPage() {
  const [tree, parentOptions] = await Promise.all([
    listCategoryTree(),
    listCategoryOptions(),
  ]);

  // Stat hesaplamaları (tree üstünde)
  const total = parentOptions.length;
  const rootCount = tree.length;
  const subCount = total - rootCount;
  let totalProducts = 0;
  let maxDepth = 0;
  let topCategoryName = "—";
  let topCategoryProducts = 0;

  function visit(node: (typeof tree)[number], depth: number) {
    totalProducts += node.productCount;
    if (depth > maxDepth) maxDepth = depth;
    if (node.productCount > topCategoryProducts) {
      topCategoryProducts = node.productCount;
      topCategoryName = node.name;
    }
    for (const child of node.children) visit(child, depth + 1);
  }
  for (const root of tree) visit(root, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Kategoriler</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Ürün kataloğunu hiyerarşik yapıyla düzenle. Düğüm üstüne gel ve
          düzenle / sil ikonlarını kullan, ya da ada tıkla detay sayfasına git.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          icon={<FolderOpen className="h-5 w-5" />}
          label="Toplam"
          value={String(total)}
          tone="indigo"
        />
        <StatTile
          icon={<Layers className="h-5 w-5" />}
          label="Kök / Alt"
          value={`${rootCount} / ${subCount}`}
          tone="sky"
        />
        <StatTile
          icon={<Package className="h-5 w-5" />}
          label="Toplam ürün"
          value={String(totalProducts)}
          tone="emerald"
        />
        <StatTile
          icon={<FolderTree className="h-5 w-5" />}
          label="En derin seviye"
          value={String(maxDepth)}
          tone="fuchsia"
        />
      </div>

      {topCategoryProducts > 0 && (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-gradient-to-r from-indigo-500/[0.06] to-fuchsia-500/[0.06] px-5 py-3 text-sm">
          <span className="text-[color:var(--color-muted)]">
            En çok ürün barındıran kategori:
          </span>{" "}
          <strong>{topCategoryName}</strong>{" "}
          <span className="text-[color:var(--color-muted)]">
            · {topCategoryProducts} ürün
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-[color:var(--color-border)]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ağaç</CardTitle>
                <CardDescription>{total} kategori — düğüme gel: düzenle/sil görünür</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <CategoryTree roots={tree} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Yeni kategori</CardTitle>
            <CardDescription>
              Üst kategori bırakırsan kök seviyede oluşur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCategoryForm parents={parentOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

