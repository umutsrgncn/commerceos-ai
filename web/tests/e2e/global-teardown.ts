/**
 * Global teardown — tüm testler bittikten sonra bir kez çalışır.
 *
 * 1. Otopilot zorla OFF (sigorta)
 * 2. E2E_ prefix'li tüm verileri temizle
 * 3. Prisma bağlantısını kapat
 */

import {
  cleanupE2eData,
  disconnectDb,
  setAutoPilotEnabled,
} from "./helpers/db";

export default async function globalTeardown() {
  console.log("[e2e] global teardown başlıyor...");
  try {
    await setAutoPilotEnabled(false);
    await cleanupE2eData();
    console.log("[e2e] Test verileri temizlendi, otopilot kapalı.");
  } catch (e) {
    console.error("[e2e] Teardown hata (yutuluyor):", e);
  } finally {
    await disconnectDb();
  }
}
