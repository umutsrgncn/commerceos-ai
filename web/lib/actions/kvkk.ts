"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { requireRole } from "@/lib/auth/permissions";

const SINGLETON_ID = "default";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

async function requireAdmin() {
  return requireRole("ADMIN");
}

// ───────────────────────── Public: deletion request ─────────────────────────

const DeletionSchema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  name: z.string().max(120).optional(),
  reason: z.string().max(2000).optional(),
});

export async function submitDeletionRequestAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = DeletionSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz" };
  }

  // Müşteri eşleşmesi (varsa)
  const customer = await db.customer.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    select: { id: true },
  });

  await db.dataDeletionRequest.create({
    data: {
      customerId: customer?.id,
      customerEmail: parsed.data.email,
      customerName: parsed.data.name,
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });

  // Public action — userId null olur (auth yok)
  try {
    await db.activityLog.create({
      data: {
        action: "kvkk.deletion_requested",
        entityType: "Customer",
        entityId: customer?.id ?? null,
        userId: null,
        userName: parsed.data.email,
        metadata: { email: parsed.data.email },
      },
    });
  } catch {}

  redirect("/data-deletion?submitted=1");
}

// ───────────────────────── Admin: review deletion request ────────────────────

export async function reviewDeletionRequestAction(
  requestId: string,
  decision: "approve" | "reject" | "complete",
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdmin();

  const status =
    decision === "approve"
      ? "APPROVED"
      : decision === "reject"
        ? "REJECTED"
        : "COMPLETED";

  await db.dataDeletionRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedBy: session.user!.id ?? null,
      reviewNote: note ?? null,
      reviewedAt: new Date(),
      ...(decision === "complete" && { completedAt: new Date() }),
    },
  });

  await recordActivity({
    action: `kvkk.deletion_${decision}d`,
    entityType: "DataDeletionRequest",
    entityId: requestId,
  });

  revalidatePath("/admin/data-requests");
  return { ok: true };
}

// ───────────────────────── Admin: KVKK ayarları ─────────────────────────────

const KvkkSettingsSchema = z.object({
  cookieBannerEnabled: z.coerce.boolean().default(false),
  dataController: z.string().max(200).optional().nullable(),
  dpoEmail: z.string().email("Geçerli e-posta").optional().or(z.literal("")),
  privacyPolicyText: z.string().max(20000).optional().nullable(),
});

export async function updateKvkkSettingsAction(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const parsed = KvkkSettingsSchema.safeParse({
    cookieBannerEnabled: formData.get("cookieBannerEnabled") === "on",
    dataController: formData.get("dataController") || null,
    dpoEmail: formData.get("dpoEmail") || "",
    privacyPolicyText: formData.get("privacyPolicyText") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz" };
  }

  const hasNewText =
    parsed.data.privacyPolicyText &&
    parsed.data.privacyPolicyText.trim().length > 0;

  await db.systemSettings.update({
    where: { id: SINGLETON_ID },
    data: {
      cookieBannerEnabled: parsed.data.cookieBannerEnabled,
      dataController: parsed.data.dataController,
      dpoEmail: parsed.data.dpoEmail || null,
      privacyPolicyText: parsed.data.privacyPolicyText,
      ...(hasNewText && { privacyPolicyUpdatedAt: new Date() }),
    },
  });

  await recordActivity({
    action: "kvkk.settings_updated",
    entityType: "SystemSettings",
    entityId: SINGLETON_ID,
  });

  revalidatePath("/admin/settings/kvkk");
  revalidatePath("/privacy");
  return { ok: true };
}

// ───────────────────────── Admin: AI ile metin üret ─────────────────────────

export async function generatePrivacyPolicyAction(): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  await requireAdmin();

  const settings = await db.systemSettings.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (!settings) return { ok: false, error: "Ayar bulunamadı" };

  const url = process.env.AI_SERVICE_URL ?? "http://ai-service:8000";
  try {
    const res = await fetch(`${url}/kvkk/privacy-policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: settings.companyName ?? "Şirket",
        tax_id: settings.taxId ?? "",
        address: settings.address ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        dpo_email: settings.dpoEmail ?? settings.email ?? "",
        data_controller: settings.dataController ?? settings.companyName ?? "",
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `AI servisi ${res.status}` };
    }
    const data = (await res.json()) as { text: string };
    return { ok: true, text: data.text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}
