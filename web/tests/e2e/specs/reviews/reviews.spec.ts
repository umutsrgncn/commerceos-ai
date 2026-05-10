import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { seedProduct, seedReview } from "../../helpers/db";

test.describe("Reviews", () => {
  test("/admin/reviews listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.reviews);
    await expect(
      authedPage.getByRole("heading", { name: /Yorumlar/i }),
    ).toBeVisible();
  });

  test("seed edilen yorum ürün detay sayfasında görünür", async ({
    authedPage,
  }) => {
    const product = await seedProduct({ name: e2eName("ReviewedProduct") });
    const review = await seedReview({
      productId: product.id,
      rating: 5,
      body: "E2E test yorumu — mükemmel!",
    });

    await authedPage.goto(ROUTES.productDetail(product.id));
    await expect(authedPage.getByText(review.body)).toBeVisible();
  });
});
