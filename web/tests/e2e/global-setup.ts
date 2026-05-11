/**
 * Global setup — tüm test'lerden ÖNCE bir kez çalışır.
 *
 * 1. Otopilot OFF (defansif — son testten kalmış olabilir)
 * 2. E2E_ prefix'li eski test verilerini temizle
 * 3. Test admin'inin var olduğundan emin ol (seed çalışmamışsa burada oluştur)
 */

import { setAutoPilotEnabled, cleanupE2eData, getDb } from "./helpers/db";
import { TEST_ADMIN } from "./helpers/test-user";
import bcrypt from "bcryptjs";

export default async function globalSetup() {
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

  // 3) Test admin
  const existing = await db.user.findUnique({
    where: { email: TEST_ADMIN.email },
  });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 12);
    await db.user.create({
      data: {
        email: TEST_ADMIN.email,
        name: TEST_ADMIN.name,
        hashedPassword,
        role: TEST_ADMIN.role,
      },
    });
    console.log(`[e2e] Test admin oluşturuldu: ${TEST_ADMIN.email}`);
  } else {
    console.log(`[e2e] Test admin mevcut: ${TEST_ADMIN.email}`);
  }

  console.log("[e2e] Setup tamam.");
}
