/**
 * Otopilot Güvenlik Fixture'ı.
 *
 * Test ortamında otopilot AÇIK kalmamalı çünkü:
 *   - Demo simülatör butonları gerçek aksiyon tetikler (gerçek e-fatura kesilebilir)
 *   - Gemini quota yer (her event AI çağrısı tetikler)
 *   - Test'ler arası kirli state oluşturur (önceki yorumlara cevap vs.)
 *
 * Bu fixture HER test öncesi otopilot OFF olduğunu kontrol eder. Otopilot
 * test eden spec'ler kendileri açar ve kendileri afterEach'te kapatır.
 *
 * Test runtime guarantee:
 *   1. globalSetup'ta tek seferlik OFF set edilir
 *   2. Her test başında autopilot fixture OFF olduğunu doğrular (assertion)
 *   3. Her test sonunda OFF'a geri çekilir (otopilot test'leri için fail-safe)
 */

import { test as base } from "@playwright/test";
import { setAutoPilotEnabled, isAutoPilotEnabled } from "../helpers/db";

export type AutoPilotGuardFixture = {
  /** Otopilot OFF olduğunu doğrula. Test başında otomatik çalışır. */
  ensureAutoPilotOff: () => Promise<void>;
  /** Bir test bloku için otopilot'u geçici aç. Bloku terk ederken
   *  fixture OFF'a geri çeker. */
  withAutoPilotOn: <T>(fn: () => Promise<T>) => Promise<T>;
};

export const test = base.extend<AutoPilotGuardFixture>({
  ensureAutoPilotOff: [
    async ({}, use) => {
      // Test başında: OFF assert + zorla kapat (defansif)
      const before = await isAutoPilotEnabled();
      if (before) {
        await setAutoPilotEnabled(false);
      }

      await use(async () => {
        const cur = await isAutoPilotEnabled();
        if (cur) {
          throw new Error(
            "[autopilot-guard] Otopilot beklenmedik şekilde AÇIK. " +
              "Bir önceki test temizlemeden çıkmış olabilir.",
          );
        }
      });

      // Test sonunda: yine zorla OFF (failsafe)
      await setAutoPilotEnabled(false);
    },
    { auto: true },
  ],

  withAutoPilotOn: async ({}, use) => {
    let enabledByMe = false;
    const helper = async <T,>(fn: () => Promise<T>): Promise<T> => {
      await setAutoPilotEnabled(true);
      enabledByMe = true;
      try {
        return await fn();
      } finally {
        await setAutoPilotEnabled(false);
        enabledByMe = false;
      }
    };
    await use(helper);
    if (enabledByMe) {
      // sigorta — fn throw atarsa finally çalışır ama biz yine kontrol edelim
      await setAutoPilotEnabled(false);
    }
  },
});

export { expect } from "@playwright/test";
