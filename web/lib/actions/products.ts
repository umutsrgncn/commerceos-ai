"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import {
  productCreateSchema,
  productUpdateSchema,
  slugify,
} from "@/lib/schemas/products";

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireSession();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    sku: formData.get("sku"),
    description: formData.get("description") || null,
    price: formData.get("price"),
    costPrice: formData.get("costPrice") ?? null,
    currency: formData.get("currency") ?? "TRY",
    status: formData.get("status") ?? "DRAFT",
    categoryId: formData.get("categoryId") || null,
    images: formData.get("images") ?? "[]",
    initialQuantity: formData.get("initialQuantity") ?? 0,
  };

  const parsed = productCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { initialQuantity, ...productData } = parsed.data;

  try {
    const created = await db.product.create({
      data: {
        ...productData,
        inventory: {
          create: { quantity: initialQuantity ?? 0 },
        },
      },
    });

    await recordActivity({
      action: "product.create",
      entityType: "product",
      entityId: created.id,
      metadata: { name: created.name, sku: created.sku },
    });

    revalidatePath("/admin/products");
    redirect(`/admin/products/${created.id}`);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
      const field = target.includes("sku") ? "sku" : "slug";
      return {
        fieldErrors: {
          [field]: [`Bu ${field === "sku" ? "SKU" : "slug"} zaten kullanılıyor.`],
        },
      };
    }
    throw err;
  }
}

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz ürün." };

  const raw = {
    id,
    name: formData.get("name") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    sku: formData.get("sku") ?? undefined,
    description: formData.get("description") ?? undefined,
    price: formData.get("price") ?? undefined,
    costPrice: formData.get("costPrice") ?? null,
    currency: formData.get("currency") ?? undefined,
    status: formData.get("status") ?? undefined,
    categoryId: formData.get("categoryId") || null,
    images: formData.get("images") ?? undefined,
  };

  const parsed = productUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id: productId, ...data } = parsed.data;

  try {
    await db.product.update({ where: { id: productId }, data });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
      const field = target.includes("sku") ? "sku" : "slug";
      return {
        fieldErrors: {
          [field]: [`Bu ${field === "sku" ? "SKU" : "slug"} zaten kullanılıyor.`],
        },
      };
    }
    throw err;
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const deleted = await db.product.delete({ where: { id } });
  await recordActivity({
    action: "product.delete",
    entityType: "product",
    entityId: id,
    metadata: { name: deleted.name, sku: deleted.sku },
  });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
