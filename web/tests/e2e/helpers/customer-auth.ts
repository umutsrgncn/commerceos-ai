/**
 * E2E için müşteri (shop) auth helper.
 *
 * Shop tarafı NextAuth değil, HMAC-imzalı cookie kullanır
 * (lib/shop/auth.ts). Aynı algoritmayla cookie üretip browser context'e
 * inject eder — login UI'ından geçmeden test kullanıcısı olarak gezilebilir.
 */
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import type { BrowserContext } from "@playwright/test";

import { getDb } from "./db";
import { E2E_PREFIX } from "./test-user";

const COOKIE_NAME = "commerceos_shop_session";
const SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";

function signToken(customerId: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${customerId}.${ts}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export type SeededCustomer = {
  id: string;
  email: string;
  name: string;
};

/** Yeni müşteri kaydı oluştur (parolası hash'li). */
export async function seedCustomerForLogin(input?: {
  email?: string;
  name?: string;
  password?: string;
}): Promise<SeededCustomer> {
  const db = getDb();
  const ts = Date.now();
  const email = input?.email ?? `e2e_customer_${ts}@example.com`;
  const name = input?.name ?? `${E2E_PREFIX}Customer_${ts}`;
  const password = input?.password ?? "demo1234";
  const passwordHash = await bcrypt.hash(password, 4);
  const customer = await db.customer.create({
    data: { email: email.toLowerCase(), name, passwordHash },
    select: { id: true, email: true, name: true },
  });
  return customer;
}

/** Browser context'e signed customer cookie'sini inject et. */
export async function attachCustomerSession(
  context: BrowserContext,
  customerId: string,
  origin = `http://localhost:${process.env.E2E_PORT ?? 3000}`,
): Promise<void> {
  const url = new URL(origin);
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: signToken(customerId),
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
  ]);
}

/** Test KVKK kayıtlarını temizler — diğer cleanup'la birlikte kullan. */
export async function cleanupKvkkRequests(): Promise<void> {
  const db = getDb();
  await db.dataDeletionRequest.deleteMany({
    where: {
      OR: [
        { customer: { email: { startsWith: "e2e_" } } },
        { customerEmail: { startsWith: "e2e_" } },
      ],
    },
  });
}
