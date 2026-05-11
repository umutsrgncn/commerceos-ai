/**
 * Saf rol hiyerarşi yardımcıları — server-only DEĞİL.
 *
 * UI ve testlerde de kullanılabilir. `permissions.ts` bunları re-export
 * ederek `requireRole` (server-only) ile birlikte sunar.
 */

export type Role = "ADMIN" | "MANAGER" | "VIEWER";

export const RANK: Record<Role, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasRole(userRole: string | undefined | null, required: Role) {
  if (!userRole) return false;
  if (!(userRole in RANK)) return false;
  return RANK[userRole as Role] >= RANK[required];
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
