import "server-only";
import { auth } from "@/auth";
import {
  hasRole,
  RANK,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  type Role,
} from "./role-utils";

/**
 * Rol hiyerarşisi:
 * - ADMIN   → her şey
 * - MANAGER → operasyonel mutasyonlar (sipariş, ürün, müşteri, gider, banka)
 * - VIEWER  → sadece okuma + kişisel profil
 *
 * Saf fonksiyonlar `role-utils.ts`'de — bu dosya server-only ve auth() çağırır.
 */

export { hasRole, ROLE_LABEL, ROLE_DESCRIPTION, type Role };

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
