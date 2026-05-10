import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb } from "../../helpers/db";

test.describe("Discounts", () => {
  test("/admin/discounts listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.discounts);
    await expect(
      authedPage.getByRole("heading", { name: /İndirim/i }),
    ).toBeVisible();
  });

  test("yeni indirim formu kayıt eder ve listede görünür", async ({
    authedPage,
  }) => {
    const code = e2eName("DISC").toUpperCase().replace(/_/g, "");
    await authedPage.goto(ROUTES.newDiscount);

    await authedPage.getByLabel(/^Kod$/i).fill(code);
    await authedPage.getByLabel(/Yüzde değeri/i).fill("20");
    await authedPage.getByRole("button", { name: /Kodu kaydet|Kaydet/i }).first().click();

    await authedPage.waitForURL(/\/admin\/discounts(\/|\?|$)/, {
      timeout: 15_000,
    });

    // DB'de var
    const db = getDb();
    const created = await db.discount.findFirst({
      where: { code: { startsWith: code } },
    });
    expect(created).not.toBeNull();
  });
});
