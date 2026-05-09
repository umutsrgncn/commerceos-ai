"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, FolderClosed, FolderOpen, Pencil, Trash2 } from "lucide-react";

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
        className="group flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-[color:var(--color-fg)]/[0.04]"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded text-[color:var(--color-muted)]",
            !hasChildren && "invisible"
          )}
          aria-label={open ? "Kapat" : "Aç"}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
          />
        </button>

        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[color:var(--color-muted)]",
            hasChildren
              ? "bg-indigo-500/10 text-indigo-500"
              : "bg-[color:var(--color-fg)]/[0.04]"
          )}
        >
          {hasChildren ? (
            open ? (
              <FolderOpen className="h-3.5 w-3.5" />
            ) : (
              <FolderClosed className="h-3.5 w-3.5" />
            )
          ) : (
            <FolderClosed className="h-3.5 w-3.5" />
          )}
        </span>

        <Link
          href={`/admin/categories/${node.id}`}
          className="flex-1 truncate text-sm hover:underline"
        >
          <span className="font-medium">{node.name}</span>
          <span className="ml-2 font-mono text-xs text-[color:var(--color-muted)]">
            /{node.slug}
          </span>
        </Link>

        <span className="hidden rounded-full bg-[color:var(--color-fg)]/[0.05] px-2 py-0.5 text-xs text-[color:var(--color-muted)] sm:inline">
          {node.productCount} ürün
        </span>

        <Link href={`/admin/categories/${node.id}`}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Düzenle"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </Link>

        <form action={deleteCategoryAction}>
          <input type="hidden" name="id" value={node.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Sil"
            className="text-[color:var(--color-muted)] opacity-0 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {hasChildren && open && (
        <ul className="mt-1 space-y-1 border-l border-dashed border-[color:var(--color-border)] pl-2">
          {node.children.map((child) => (
            <Node key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
