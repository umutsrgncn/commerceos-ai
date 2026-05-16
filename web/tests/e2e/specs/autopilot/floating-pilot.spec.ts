/**
 * Floating Otopilot Pilot — sağ alttaki sürekli aktif indicator.
 *
 * - Otopilot KAPALI iken görünmüyor
 * - Otopilot AÇIK iken görünür ve click → expand
 * - /api/autopilot/recent endpoint'i polling target'ı
 *
 * NOT: Toast'ın gerçek tetiklenmesini test etmek (yeni AutoPilotAction
 * geldiğinde sağ altta açılır mı) timing'e bağlı; bu spec mimari
 * doğrulamasıyla yetinir (endpoint çalışıyor mu, panel render oluyor mu).
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { getDb } from "../../helpers/db";

test.describe("Floating Pilot", () => {
  test("otopilot KAPALI iken floating button görünmez", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.dashboard);

    // Pilot button'unun aria-label'ı 'Otopilot canlı feed'
    const pilot = authedPage.getByRole("button", {
      name: /Otopilot canlı feed/i,
    });
    await expect(pilot).toHaveCount(0);
  });

  test("otopilot AÇIK iken floating button görünür ve click expand eder", async ({
    authedPage,
    withAutoPilotOn,
  }) => {
    await withAutoPilotOn(async () => {
      await authedPage.goto(ROUTES.dashboard);

      const pilot = authedPage.getByRole("button", {
        name: /Otopilot canlı feed/i,
      });
      await expect(pilot).toBeVisible({ timeout: 5_000 });

      // Click → expand panel. Panel açılınca timeline link'i + Otopilot
      // başlığı/empty-state görünür. ("Otopilot canlı" aria-label'da, text'te değil.)
      await pilot.click();
      await expect(
        authedPage.getByRole("link", { name: /Tüm timeline'a git/i }),
      ).toBeVisible();
    });
  });

  test("/api/autopilot/recent endpoint authed çağrıyı kabul eder", async ({
    request,
    authedPage,
  }) => {
    // Authed cookie context'inden çağrı yap
    const cookies = await authedPage.context().cookies();
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const r = await request.get("/api/autopilot/recent?limit=5", {
      headers: { cookie: cookieHeader },
    });
    expect(r.ok()).toBe(true);
    const data = await r.json();
    expect(data).toHaveProperty("enabled");
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("serverTime");
  });

  test("/api/autopilot/recent unauth → 401", async ({ request }) => {
    const r = await request.get("/api/autopilot/recent?limit=5");
    expect(r.status()).toBe(401);
  });

  test("expand panel otopilot AÇIK + DB'de aksiyon varsa son 5'i listeler", async ({
    authedPage,
    withAutoPilotOn,
  }) => {
    // Direkt DB'ye 1 EXECUTED action yaz (AI çağrısı yapmadan)
    const db = getDb();
    const action = await db.autoPilotAction.create({
      data: {
        type: "REVIEW_REPLY",
        triggerSource: "review:e2e_test",
        triggerSummary: "E2E test trigger",
        decision: "E2E test cevabı yazıldı",
        reasoning: "Test için manuel oluşturuldu",
        confidence: 95,
        status: "EXECUTED",
        executedAt: new Date(),
      },
    });

    await withAutoPilotOn(async () => {
      await authedPage.goto(ROUTES.dashboard);

      const pilot = authedPage.getByRole("button", {
        name: /Otopilot canlı feed/i,
      });
      await expect(pilot).toBeVisible({ timeout: 5_000 });
      await pilot.click();

      // Decision text'i panel içinde görünmeli
      await expect(
        authedPage.getByText(/E2E test cevabı yazıldı/i),
      ).toBeVisible({ timeout: 12_000 });
    });

    // Cleanup
    await db.autoPilotAction.delete({ where: { id: action.id } });
  });
});
