"use client";

import { useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/lib/actions/categories";
import type { CategoryNode } from "@/lib/queries/categories";
import { cn } from "@/lib/cn";

export function CategoryTree({ roots }: { roots: CategoryNode[] }) {
  if (roots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-8 text-center text-sm text-[color:var(--color-muted)]">
        Henüz kategori yok. Yandaki formdan ilkini ekle.
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {roots.map((node) => (
        <Node key={node.id} node={node} depth={0} />
      ))}
    </ul>
  );
}

function Node({ node, depth }: { node: CategoryNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[color:var(--color-fg)]/[0.04]"
        style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-5 w-5 place-items-center text-[color:var(--color-muted)]",
            !hasChildren && "invisible"
          )}
          aria-label={open ? "Kapat" : "Aç"}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
          />
        </button>

        <div className="flex-1 text-sm">
          <span className="font-medium">{node.name}</span>{" "}
          <span className="font-mono text-xs text-[color:var(--color-muted)]">
            /{node.slug}
          </span>
        </div>

        <span className="rounded-full bg-[color:var(--color-fg)]/[0.05] px-2 py-0.5 text-xs text-[color:var(--color-muted)]">
          {node.productCount} ürün
        </span>

        <form action={deleteCategoryAction}>
          <input type="hidden" name="id" value={node.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Sil"
            className="text-[color:var(--color-muted)] hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {hasChildren && open && (
        <ul className="mt-1 space-y-1">
          {node.children.map((child) => (
            <Node key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
