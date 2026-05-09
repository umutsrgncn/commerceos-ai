"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/schemas/profile";
import { recordActivity } from "@/lib/activity";

export type ProfileActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const userId = await requireUser();

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: parsed.data,
    });
    await recordActivity({
      action: "user.profile.update",
      entityType: "user",
      entityId: userId,
    });
    revalidatePath("/admin/profile");
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { email: ["Bu e-posta başka bir hesapta kullanılıyor."] } };
    }
    throw err;
  }
}

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const userId = await requireUser();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return { error: "Bu hesap OAuth ile açılmış, şifresi yok. OAuth provider'ından değiştir." };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.hashedPassword);
  if (!ok) {
    return { fieldErrors: { currentPassword: ["Mevcut şifre hatalı."] } };
  }

  const newHashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: userId },
    data: { hashedPassword: newHashed },
  });
  await recordActivity({
    action: "user.password.change",
    entityType: "user",
    entityId: userId,
  });

  return { ok: true };
}
