import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Categories", () => {
  test("kategori ağaç sayfası yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.categories);
    await expect(
      authedPage.getByRole("heading", { name: /Kategoriler/i }),
    ).toBeVisible();
  });
});
