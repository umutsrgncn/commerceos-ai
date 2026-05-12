import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";

const COOKIE_NAME = "commerceos_shop_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 gün
const SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";

/** HMAC ile imzalı cookie payload: customerId:timestamp:sig */
function sign(customerId: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${customerId}.${ts}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): { customerId: string; ts: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, tsStr, sig] = parts;
  const expected = createHmac("sha256", SECRET)
    .update(`${customerId}.${tsStr}`)
    .digest("base64url");
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return null;
  // Çok eski cookie'leri reddet (30 gün)
  if (Date.now() / 1000 - ts > MAX_AGE) return null;
  return { customerId, ts };
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

// ─── Schemas ───────────────────────────────────────────────────────────────

export const customerRegisterSchema = z.object({
  email: z.string().email("Geçerli e-posta gerekli").max(160),
  name: z.string().min(2, "Ad en az 2 karakter").max(160),
  password: z.string().min(8, "Şifre en az 8 karakter").max(128),
  phone: z.string().max(20).optional().nullable(),
});

export const customerLoginSchema = z.object({
  email: z.string().email("Geçerli e-posta gerekli").max(160),
  password: z.string().min(1, "Şifre gerekli").max(128),
});

// ─── Public API ────────────────────────────────────────────────────────────

export type ShopSessionCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

/** Şu anki müşteriyi getir — yoksa null. */
export async function getCurrentCustomer(): Promise<ShopSessionCustomer | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const v = verify(token);
  if (!v) return null;
  const c = await db.customer.findUnique({
    where: { id: v.customerId },
    select: { id: true, name: true, email: true, phone: true },
  });
  return c;
}

/** Login zorunlu — yoksa /shop/auth/login'e redirect (next dahil). */
export async function requireCustomer(
  redirectTo = "/shop/account",
): Promise<ShopSessionCustomer> {
  const c = await getCurrentCustomer();
  if (!c) {
    const next = encodeURIComponent(redirectTo);
    redirect(`/shop/auth/login?next=${next}`);
  }
  return c;
}

async function setSessionCookie(customerId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(customerId), {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// Internal helpers — actions.ts'ten çağrılır
export async function loginCustomer(email: string, password: string) {
  const customer = await db.customer.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });
  if (!customer || !customer.passwordHash) {
    return { ok: false as const, error: "E-posta veya şifre hatalı." };
  }
  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "E-posta veya şifre hatalı." };
  }
  await setSessionCookie(customer.id);
  return { ok: true as const, customerId: customer.id };
}

export async function registerCustomer(
  email: string,
  name: string,
  password: string,
  phone: string | null = null,
) {
  const lower = email.toLowerCase();
  const existing = await db.customer.findUnique({
    where: { email: lower },
    select: { id: true, passwordHash: true },
  });
  if (existing?.passwordHash) {
    return { ok: false as const, error: "Bu e-posta zaten kayıtlı. Giriş yap." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const customer = existing
    ? await db.customer.update({
        where: { id: existing.id },
        data: { passwordHash, name, phone },
        select: { id: true },
      })
    : await db.customer.create({
        data: { email: lower, name, phone, passwordHash },
        select: { id: true },
      });
  await setSessionCookie(customer.id);
  return { ok: true as const, customerId: customer.id };
}

export async function logoutCustomer() {
  await clearSessionCookie();
}
