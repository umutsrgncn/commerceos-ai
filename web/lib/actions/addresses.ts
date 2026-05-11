"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

const AddressSchema = z.object({
  customerId: z.string().cuid(),
  label: z.string().max(40).optional().nullable(),
  fullName: z.string().min(2, "Ad soyad gerekli").max(160),
  phone: z.string().max(40).optional().nullable(),
  line1: z.string().min(3, "Adres satırı gerekli").max(300),
  line2: z.string().max(300).optional().nullable(),
  city: z.string().min(2, "İl gerekli").max(80),
  district: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(15).optional().nullable(),
  country: z.string().max(80).default("TR"),
  isCompany: z.coerce.boolean().default(false),
  taxId: z.string().max(20).optional().nullable(),
  taxOffice: z.string().max(120).optional().nullable(),
  isDefault: z.coerce.boolean().default(false),
});

export type AddressActionState = {
  ok: boolean;
  error?: string;
} | null;

export async function createCustomerAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  await requireSession();

  const parsed = AddressSchema.safeParse({
    customerId: formData.get("customerId"),
    label: formData.get("label") || null,
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || null,
    line1: formData.get("line1"),
    line2: formData.get("line2") || null,
    city: formData.get("city"),
    district: formData.get("district") || null,
    postalCode: formData.get("postalCode") || null,
    country: formData.get("country") || "TR",
    isCompany: formData.get("isCompany") === "on",
    taxId: formData.get("taxId") || null,
    taxOffice: formData.get("taxOffice") || null,
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz" };
  }

  await db.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId: parsed.data.customerId },
        data: { isDefault: false },
      });
    }
    await tx.customerAddress.create({ data: parsed.data });
  });

  await recordActivity({
    action: "customer.address_added",
    entityType: "Customer",
    entityId: parsed.data.customerId,
  });

  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return { ok: true };
}

export async function deleteCustomerAddressAction(
  addressId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  const addr = await db.customerAddress.findUnique({
    where: { id: addressId },
    select: { customerId: true },
  });
  if (!addr) return { ok: false, error: "Bulunamadı" };

  await db.customerAddress.delete({ where: { id: addressId } });

  await recordActivity({
    action: "customer.address_removed",
    entityType: "Customer",
    entityId: addr.customerId,
  });

  revalidatePath(`/admin/customers/${addr.customerId}`);
  return { ok: true };
}
