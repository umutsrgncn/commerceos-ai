import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // hashedPassword DAHİL EDİLMEZ — sadece kullanıcı şifresinin var olup olmadığı
  // bilgisi (UI'da "şifre değiştir" butonu vs için) — değerin kendisi ASLA değil
  const u = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      hashedPassword: true,
    },
  });
  if (!u) return null;
  const { hashedPassword, ...safe } = u;
  return { ...safe, hasPassword: !!hashedPassword };
}
