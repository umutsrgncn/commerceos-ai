"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export type SupplierActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

function parseSkus(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function createSupplierAction(
  formData: FormData,
): Promise<SupplierActionResult> {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const contactPerson = String(formData.get("contactPerson") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const productSkus = parseSkus(formData.get("productSkus"));
  const leadTime = Number(formData.get("leadTimeDays") ?? 7);
  const isActive = formData.get("isActive") === "on";

  if (name.length < 2) {
    return {
      ok: false,
      fieldErrors: { name: ["En az 2 karakter olmalı"] },
    };
  }

  try {
    const created = await db.supplier.create({
      data: {
        name,
        email,
        phone,
        contactPerson,
        address,
        notes,
        productSkus,
        leadTimeDays: Number.isFinite(leadTime) ? leadTime : 7,
        isActive,
      },
    });
    await recordActivity({
      action: "supplier.create",
      entityType: "supplier",
      entityId: created.id,
      metadata: { name, productCount: productSkus.length },
    });
    revalidatePath("/admin/suppliers");
    return { ok: true, id: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Hata";
    if (msg.includes("Unique constraint") && msg.includes("email")) {
      return {
        ok: false,
        fieldErrors: { email: ["Bu email zaten kayıtlı"] },
      };
    }
    return { ok: false, error: msg };
  }
}

export async function updateSupplierAction(
  formData: FormData,
): Promise<SupplierActionResult> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID yok" };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, fieldErrors: { name: ["En az 2 karakter"] } };
  }

  await db.supplier.update({
    where: { id },
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      contactPerson: String(formData.get("contactPerson") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      productSkus: parseSkus(formData.get("productSkus")),
      leadTimeDays: Number(formData.get("leadTimeDays") ?? 7) || 7,
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  return { ok: true, id };
}

export async function deleteSupplierAction(
  formData: FormData,
): Promise<SupplierActionResult> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "ID yok" };
  await db.supplier.delete({ where: { id } });
  revalidatePath("/admin/suppliers");
  return { ok: true };
}
