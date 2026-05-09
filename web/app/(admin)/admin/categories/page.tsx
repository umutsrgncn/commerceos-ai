import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCategoryTree } from "@/lib/queries/categories";
import { CategoryTree } from "./components/category-tree";
import { CreateCategoryForm } from "./components/create-form";

export const metadata = { title: "Kategoriler — CommerceOS" };

function flatten(
  roots: Awaited<ReturnType<typeof listCategoryTree>>
): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  function visit(
    node: (typeof roots)[number],
    prefix: string
  ) {
    const label = prefix ? `${prefix} › ${node.name}` : node.name;
    out.push({ id: node.id, name: label });
    for (const child of node.children) visit(child, label);
  }
  for (const root of roots) visit(root, "");
  return out;
}

export default async function CategoriesPage() {
  const tree = await listCategoryTree();
  const parentOptions = flatten(tree);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kategoriler</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Ürün kataloğunu hiyerarşik yapıyla düzenle. Slug değiştirmek
          ürünlerin URL'lerini etkiler.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ağaç</CardTitle>
            <CardDescription>
              {parentOptions.length} kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
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
