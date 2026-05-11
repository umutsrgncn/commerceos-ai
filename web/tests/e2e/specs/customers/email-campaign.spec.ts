/**
 * E-posta kampanyası testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer } from "../../helpers/db";

test.describe("Email campaign", () => {
  test("/admin/customers/campaign sayfası 4 segment kartı + form", async ({
    authedPage,
  }) => {
    await authedPage.goto("/admin/customers/campaign");
    await expect(
      authedPage.getByRole("heading", { name: /E-posta kampanyası/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("heading", { name: /Hedef segment/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /Sadık müşteriler/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /Tüm müşteriler/i }),
    ).toBeVisible();
  });

  test("AI içerik üretmeden manuel subject + body ile gönder çalışır", async ({
    authedPage,
  }) => {
    // En az bir 'all' segmentine girecek müşteri seed et
    const c = await seedCustomer({ name: e2eName("CampaignTarget") });

    await authedPage.goto("/admin/customers/campaign");

    // 'Tüm müşteriler' kartına tıkla
    await authedPage
      .getByRole("button", { name: /Tüm müşteriler/i })
      .click();

    // Manuel subject + body gir
    const subject = `${e2eName("CampSubject")} test`;
    await authedPage.getByLabel(/^Konu$/i).fill(subject);
    await authedPage
      .getByLabel(/^İçerik$/i)
      .fill("Bu bir test email içeriğidir, gerçek değil.");

    // Gönder
    await authedPage
      .getByRole("button", { name: /kişiye gönder/i })
      .click();

    // Sonuç
    await expect(authedPage.getByText(/Gönderildi!/i)).toBeVisible({
      timeout: 15_000,
    });

    // DB doğrulama
    const db = getDb();
    const sent = await db.customerEmail.findFirst({
      where: { customerId: c.id, subject },
    });
    expect(sent).not.toBeNull();
    expect(sent?.status).toBe("SENT");

    // Cleanup
    if (sent) {
      await db.customerEmail.deleteMany({
        where: { campaignTag: sent.campaignTag },
      });
    }
  });
});
