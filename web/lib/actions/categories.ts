"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  slugify,
} from "@/lib/schemas/categories";
import { getDescendantIds } from "@/lib/queries/categories";

export type CategoryActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  return requireRole("MANAGER");
}

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireSession();

  const name = String(formData.get("name") ?? "");
  const parsed = categoryCreateSchema.safeParse({
    name,
    slug: formData.get("slug") || slugify(name),
    description: formData.get("description") || null,
    imageUrl: formData.get("imageUrl") || null,
    parentId: formData.get("parentId") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        parentId: parsed.data.parentId ?? null,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { slug: ["Bu slug zaten kullanılıyor."] } };
    }
    throw err;
  }
}

export async function updateCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz kategori." };

  const parsed = categoryUpdateSchema.safeParse({
    id,
    name: formData.get("name") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? undefined,
    parentId: formData.get("parentId") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id: catId, parentId, ...rest } = parsed.data;

  // Block circular parents: parent cannot be self or any descendant of self.
  if (parentId) {
    if (parentId === catId) {
      return { error: "Kategori kendi üst kategorisi olamaz." };
    }
    const descendants = await getDescendantIds(catId);
    if (descendants.includes(parentId)) {
      return { error: "Üst kategori, alt kategorilerden biri olamaz (döngü)." };
    }
  }

  try {
    await db.category.update({
      where: { id: catId },
      data: { ...rest, parentId },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { slug: ["Bu slug zaten kullanılıyor."] } };
    }
    throw err;
  }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // Prisma onDelete: SetNull on Product.categoryId & Category.parentId, so
  // products and child categories survive — they just lose the link.
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
