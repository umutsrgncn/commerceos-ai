import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
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
}
