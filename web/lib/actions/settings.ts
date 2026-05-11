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

export type AutoPilotRuleInput = {
  enabled: boolean;
  monthlyBudgetMinor: number | null;
  confidenceThreshold: number;
  // Yorumlar
  autoReplyReviews: boolean;
  autoAnalyzeReviews: boolean;
  // Finans
  autoIssueInvoices: boolean;
  autoMatchBank: boolean;
  autoConfirmOrders: boolean;
  // Stok & Tedarikçi
  autoReorderStock: boolean;
  autoSuggestPrice: boolean;
  // Müşteri
  autoSegmentCustomers: boolean;
};

export async function updateAutoPilotSettingsAction(
  input: AutoPilotRuleInput,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const threshold = Math.max(
    0,
    Math.min(100, Math.round(input.confidenceThreshold)),
  );
  const wasEnabled = await db.systemSettings
    .findUnique({
      where: { id: SINGLETON_ID },
      select: { autoPilotEnabled: true },
    })
    .then((s) => s?.autoPilotEnabled ?? false);

  const data = {
    autoPilotEnabled: input.enabled,
    autoPilotMonthlyBudgetMinor: input.monthlyBudgetMinor,
    autoPilotConfidenceThreshold: threshold,
    autoPilotAutoReplyReviews: input.autoReplyReviews,
    autoPilotAutoAnalyzeReviews: input.autoAnalyzeReviews,
    autoPilotAutoIssueInvoices: input.autoIssueInvoices,
    autoPilotAutoMatchBank: input.autoMatchBank,
    autoPilotAutoConfirmOrders: input.autoConfirmOrders,
    autoPilotAutoReorderStock: input.autoReorderStock,
    autoPilotAutoSuggestPrice: input.autoSuggestPrice,
    autoPilotAutoSegmentCustomers: input.autoSegmentCustomers,
  };

  await db.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {
      ...data,
      autoPilotEnabledAt:
        input.enabled && !wasEnabled ? new Date() : undefined,
    },
    create: {
      id: SINGLETON_ID,
      ...data,
      autoPilotEnabledAt: input.enabled ? new Date() : null,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/autopilot");
  revalidatePath("/admin");
  return { ok: true };
}

/** Onboarding wizard'ı tamamlandı olarak işaretle. */
export async function completeOnboardingAction(): Promise<{ ok: boolean }> {
  await requireAdmin();
  await db.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: { onboardingCompletedAt: new Date() },
    create: { id: SINGLETON_ID, onboardingCompletedAt: new Date() },
  });
  revalidatePath("/admin");
  return { ok: true };
}
