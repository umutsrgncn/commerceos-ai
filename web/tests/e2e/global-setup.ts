/**
 * Global setup — tüm test'lerden ÖNCE bir kez çalışır.
 *
 * 1. Otopilot OFF (defansif — son testten kalmış olabilir)
 * 2. E2E_ prefix'li eski test verilerini temizle
 * 3. Test admin'inin var olduğundan emin ol (seed çalışmamışsa burada oluştur)
 */

import { setAutoPilotEnabled, cleanupE2eData, getDb, assertTestSchema } from "./helpers/db";
import { TEST_ADMIN } from "./helpers/test-user";
import bcrypt from "bcryptjs";

export default async function globalSetup() {
  // İLK İŞ: schema=commerceos_test güvencesi — herhangi bir tablo işlemine
  // başlamadan önce DATABASE_URL'in production'a bakmadığını kanıtla.
  assertTestSchema();
  console.log("[e2e] schema=commerceos_test doğrulandı, public izole");
  console.log("[e2e] global setup başlıyor...");

  // 1) Otopilot OFF + onboarding completed (modal block etmesin)
  await setAutoPilotEnabled(false);
  const db = getDb();
  await db.systemSettings.upsert({
    where: { id: "default" },
    update: {
      autoPilotEnabled: false,
      onboardingCompletedAt: new Date(),
    },
    create: {
      id: "default",
      autoPilotEnabled: false,
      onboardingCompletedAt: new Date(),
    },
  });
  console.log("[e2e] Otopilot kapalı, onboarding tamamlandı");

  // 2) Eski E2E_ verilerini temizle
  await cleanupE2eData();
  console.log("[e2e] Eski test verileri temizlendi");

  // 3) Test admin — UPSERT: hash her zaman TEST_ADMIN.password ile eşleşsin.
  // create-if-not-exists yetersiz: önceki run'dan kalan stale hash login'i
  // fail'a düşürür ve fark edilmez (test silently fail eder).
  const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 12);
  await db.user.upsert({
    where: { email: TEST_ADMIN.email },
    update: { hashedPassword, name: TEST_ADMIN.name, role: TEST_ADMIN.role },
    create: {
      email: TEST_ADMIN.email,
      name: TEST_ADMIN.name,
      hashedPassword,
      role: TEST_ADMIN.role,
    },
  });
  console.log(`[e2e] Test admin upsert tamam (fresh hash): ${TEST_ADMIN.email}`);

  console.log("[e2e] Setup tamam.");
}
