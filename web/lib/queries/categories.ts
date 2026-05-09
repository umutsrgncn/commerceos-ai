import "server-only";
import { db } from "@/lib/db";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  productCount: number;
  children: CategoryNode[];
};

export async function listCategoryTree(): Promise<CategoryNode[]> {
  const flat = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const nodes = new Map<string, CategoryNode>(
    flat.map((c) => [
      c.id,
      {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        parentId: c.parentId,
        productCount: c._count.products,
        children: [],
      },
    ])
  );

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      },
      products: {
        select: { id: true, name: true, sku: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      _count: { select: { products: true } },
    },
  });
}

/**
 * Hiyerarşik dropdown için breadcrumb-formatlı liste:
 *   [{ id, name: "Kıyafet" }, { id, name: "Kıyafet › Tişört" }, ...]
 *
 * Sıralama parent-then-children — aynı select'te alt kategoriler
 * üst kategorilerin hemen ardında görünür.
 */
export async function listCategoryOptions(): Promise<
  { id: string; name: string }[]
> {
  const tree = await listCategoryTree();
  const out: { id: string; name: string }[] = [];

  function visit(node: CategoryNode, prefix: string) {
    const label = prefix ? `${prefix} › ${node.name}` : node.name;
    out.push({ id: node.id, name: label });
    for (const child of node.children) visit(child, label);
  }

  for (const root of tree) visit(root, "");
  return out;
}

/** Returns the id and all descendant ids for the given root. */
export async function getDescendantIds(rootId: string): Promise<string[]> {
  const all = await db.category.findMany({
    select: { id: true, parentId: true },
  });
  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      const list = childrenOf.get(c.parentId) ?? [];
      list.push(c.id);
      childrenOf.set(c.parentId, list);
    }
  }
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    const kids = childrenOf.get(id) ?? [];
    stack.push(...kids);
  }
  return out;
}
