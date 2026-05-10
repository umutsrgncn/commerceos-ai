/**
 * Programmatic auth fixture.
 *
 * UI'dan login yapmak yerine NextAuth credentials provider'a doğrudan
 * POST atar, session cookie'sini browser context'e enjekte eder. Auth UI
 * test'i değil, başka feature'lar test edildiğinde kullan.
 *
 * Auth UI'ı test ediliyorsa fixture'ı kullanma, doğrudan UI'dan login.
 */

import { request, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { TEST_ADMIN } from "../helpers/test-user";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;

/** Cookie'leri NextAuth credentials provider'dan al, browser context'e
 *  enjekte et. Bu, login UI'ını her testte tekrar çevirmemenin hızlı yolu. */
export async function loginAsAdmin(context: BrowserContext): Promise<void> {
  const apiContext = await request.newContext({ baseURL: BASE });

  // 1. CSRF token al
  const csrfRes = await apiContext.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  // 2. Credentials login (NextAuth callback)
  await apiContext.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      callbackUrl: `${BASE}/admin`,
      json: "true",
    },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // 3. Session cookie'lerini browser context'e taşı
  const cookies = await apiContext.storageState();
  await context.addCookies(cookies.cookies);

  await apiContext.dispose();
}

/** Yeni bir authenticated page oluştur. Test başında kullan:
 *    const page = await loggedInPage(browser);
 */
export async function loggedInPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  await loginAsAdmin(ctx);
  return ctx.newPage();
}
