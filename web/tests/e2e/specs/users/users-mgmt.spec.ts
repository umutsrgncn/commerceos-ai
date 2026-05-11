/**
 * Ekip & Rol yönetimi smoke testi.
 *
 * - /admin/users sayfası ADMIN'e açılır
 * - Mevcut admin listede görünür
 * - Sidebar'da KVKK/Ayarlar/Ekip linkleri var (ADMIN için)
 * - Kullanıcı profilinde rol rozet
 */

import { test, expect } from "../../fixtures";
import { TEST_ADMIN } from "../../helpers/test-user";

test.describe("Users management", () => {
  test("/admin/users açılır + admin demo kullanıcı listede", async ({
    authedPage,
  }) => {
    await authedPage.goto("/admin/users");
    await expect(
      authedPage.getByRole("heading", { name: /Ekip ve Roller/i }),
    ).toBeVisible();

    // Tabloda 'demo@commerceos.dev' satırı (UserMenu'deki ile karışmasın diye cell)
    await expect(
      authedPage.getByRole("cell", { name: TEST_ADMIN.email }),
    ).toBeVisible();
    // 'sen' rozeti
    await expect(authedPage.getByText("sen", { exact: true })).toBeVisible();
  });

  test("3 rol kart önizlemesi görünür", async ({ authedPage }) => {
    await authedPage.goto("/admin/users");
    await expect(authedPage.getByText("Yönetici").first()).toBeVisible();
    await expect(authedPage.getByText("Operasyon").first()).toBeVisible();
    await expect(authedPage.getByText("İzleyici").first()).toBeVisible();
  });

  test("'Yeni kullanıcı davet et' butonu açılır", async ({ authedPage }) => {
    await authedPage.goto("/admin/users");
    await authedPage
      .getByRole("button", { name: /Yeni kullanıcı davet et/i })
      .click();

    await expect(authedPage.getByLabel(/Geçici parola/i)).toBeVisible();
    await expect(authedPage.getByLabel(/^Rol$/i)).toBeVisible();
  });

  test("Sidebar ADMIN'e Ekip + KVKK + Ayarlar linklerini gösterir", async ({
    authedPage,
  }) => {
    await authedPage.goto("/admin");
    // md+ ekranda label görünür; default 1280x720
    await expect(
      authedPage.getByRole("link", { name: /Ekip/i }).first(),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("link", { name: /^KVKK$/i }).first(),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("link", { name: /^Ayarlar$/i }).first(),
    ).toBeVisible();
  });

  test("UserMenu rol rozet gösterir (Yönetici)", async ({ authedPage }) => {
    await authedPage.goto("/admin");
    // Hesap menü trigger'ına tıkla
    await authedPage.getByRole("button", { name: /Hesap menüsü/i }).click();
    await expect(authedPage.getByText("Yönetici").first()).toBeVisible();
  });
});
