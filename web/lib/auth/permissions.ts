import "server-only";
import { auth } from "@/auth";

/**
 * Rol hiyerarşisi:
 * - ADMIN   → her şey
 * - MANAGER → operasyonel mutasyonlar (sipariş, ürün, müşteri, gider, banka)
 * - VIEWER  → sadece okuma + kişisel profil
 *
 * Buradaki helper'lar Server Action / Route Handler giriş kontrolü için.
 * UI tarafı için `hasRole()` aynı mantıkla saf fonksiyon.
 */

export type Role = "ADMIN" | "MANAGER" | "VIEWER";

const RANK: Record<Role, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasRole(userRole: string | undefined | null, required: Role) {
  if (!userRole) return false;
  if (!(userRole in RANK)) return false;
  return RANK[userRole as Role] >= RANK[required];
}

export async function requireRole(required: Role) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  const role = (session.user as { role?: string }).role;
  if (!hasRole(role, required)) {
    throw new Error(
      `FORBIDDEN: ${required} rolü gerekli (mevcut: ${role ?? "yok"})`,
    );
  }
  return session;
}

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !(role in RANK)) return null;
  return role as Role;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Yönetici",
  MANAGER: "Operasyon",
  VIEWER: "İzleyici",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  ADMIN: "Tüm yetkilere sahip — kullanıcı, ayar ve KVKK yönetimi dahil",
  MANAGER: "Sipariş, ürün, müşteri, gider ve banka yönetebilir",
  VIEWER: "Sadece görüntüleyebilir, değişiklik yapamaz",
};
