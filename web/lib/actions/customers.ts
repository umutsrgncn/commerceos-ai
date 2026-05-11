"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  customerCreateSchema,
  customerUpdateSchema,
} from "@/lib/schemas/customers";

export type CustomerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
}

function parseAddress(formData: FormData) {
  const line1 = String(formData.get("address.line1") ?? "").trim();
  const city = String(formData.get("address.city") ?? "").trim();
  const country = String(formData.get("address.country") ?? "").trim();
  if (!line1 && !city && !country) return null;
  return {
    line1: line1 || undefined,
    line2: String(formData.get("address.line2") ?? "").trim() || undefined,
    city: city || undefined,
    state: String(formData.get("address.state") ?? "").trim() || undefined,
    postalCode: String(formData.get("address.postalCode") ?? "").trim() || undefined,
    country: country || undefined,
  };
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  await requireSession();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    notes: formData.get("notes") || null,
    address: parseAddress(formData),
  };

  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await db.customer.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        notes: parsed.data.notes ?? null,
        address: parsed.data.address ?? Prisma.JsonNull,
      },
    });

    // Otopilot: yeni müşteriyi AI ile segmente et (otopilot ON ise)
    try {
      const { autoSegmentCustomer } = await import("@/lib/autopilot/core");
      await autoSegmentCustomer(created.id);
    } catch {
      // sessizce devam
    }

    revalidatePath("/admin/customers");
    redirect(`/admin/customers/${created.id}`);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { email: ["Bu e-posta zaten kayıtlı."] } };
    }
    throw err;
  }
}

export async function updateCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz müşteri." };

  const raw = {
    id,
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    phone: formData.get("phone") || null,
    notes: formData.get("notes") || null,
    address: parseAddress(formData),
  };

  const parsed = customerUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id: customerId, address, ...rest } = parsed.data;

  try {
    await db.customer.update({
      where: { id: customerId },
      data: {
        ...rest,
        address: address === undefined ? undefined : (address ?? Prisma.JsonNull),
      },
    });
    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { email: ["Bu e-posta zaten kayıtlı."] } };
    }
    throw err;
  }
}

export async function deleteCustomerAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
