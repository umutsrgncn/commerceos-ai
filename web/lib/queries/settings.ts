import "server-only";
import { db } from "@/lib/db";

const SINGLETON_ID = "default";

export async function getSettings() {
  return db.systemSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}
