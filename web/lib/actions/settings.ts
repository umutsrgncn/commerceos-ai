"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gibSettingsSchema, settingsUpdateSchema } from "@/lib/schemas/settings";

export type SettingsActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const SINGLETON_ID = "default";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  // Role gating could go here (ADMIN/MANAGER); for the demo any authed
  // user can edit settings. Toughen with `if (session.user.role !== 'ADMIN')`.
  return session;
}

export async function updateSettingsAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireAdmin();

  const parsed = settingsUpdateSchema.safeParse({
    companyName: formData.get("companyName"),
    taxId: formData.get("taxId") || null,
    address: formData.get("address") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") ?? "",
    defaultCurrency: formData.get("defaultCurrency") ?? "TRY",
    defaultTaxRate: formData.get("defaultTaxRate") ?? 0,
    timezone: formData.get("timezone") ?? "Europe/Istanbul",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: parsed.data,
    create: { id: SINGLETON_ID, ...parsed.data },
  });

  revalidatePath("/admin/settings");
  // Receipts read settings → revalidate any printed pages too.
  revalidatePath("/admin/orders", "layout");

  return { ok: true };
}

export async function updateGibSettingsAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireAdmin();

  const parsed = gibSettingsSchema.safeParse({
    gibMode: formData.get("gibMode") ?? "test",
    gibIntegratorUrl: formData.get("gibIntegratorUrl") ?? "",
    gibUsername: formData.get("gibUsername") || null,
    gibPasswordEncrypted: formData.get("gibPasswordEncrypted") || null,
    gibSenderAlias: formData.get("gibSenderAlias") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: parsed.data,
    create: { id: SINGLETON_ID, ...parsed.data },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
