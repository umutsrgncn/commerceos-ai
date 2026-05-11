"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role as PrismaRole } from "@prisma/client";

import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { requireRole } from "@/lib/auth/permissions";

export type UserActionState = { ok: boolean; error?: string } | null;

const InviteSchema = z.object({
  name: z.string().min(2, "Ad gerekli").max(120),
  email: z.string().email("Geçerli e-posta gerekli").max(160),
  password: z.string().min(8, "En az 8 karakter").max(128),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
});

export async function inviteUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  await requireRole("ADMIN");

  const parsed = InviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz" };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      role: parsed.data.role as PrismaRole,
    },
  });

  await recordActivity({
    action: "user.invited",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: "ADMIN" | "MANAGER" | "VIEWER",
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("ADMIN");

  // Kendini düşürmeyi engelle (en az 1 admin kalsın diye)
  if (session.user!.id === userId && role !== "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return {
        ok: false,
        error: "Son ADMIN'i düşüremezsin — önce başka bir admin oluştur",
      };
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { role: role as PrismaRole },
  });

  await recordActivity({
    action: "user.role_changed",
    entityType: "User",
    entityId: userId,
    metadata: { newRole: role },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("ADMIN");

  if (session.user!.id === userId) {
    return { ok: false, error: "Kendini silemezsin" };
  }

  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (target?.role === "ADMIN" && adminCount <= 1) {
    return { ok: false, error: "Son ADMIN'i silemezsin" };
  }

  await db.user.delete({ where: { id: userId } });

  await recordActivity({
    action: "user.deleted",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
