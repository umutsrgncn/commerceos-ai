/**
 * INTERNAL TEST ENDPOINT — production'da kaldırılmalı.
 * registerCustomer helper'ını curl ile test etmek için.
 *
 * POST /api/test/register-customer
 * { "email": "...", "name": "...", "password": "...", "phone": "..." }
 */

import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in prod" }, { status: 403 });
  }
  const body = await req.json();
  const result = await registerCustomer(
    body.email,
    body.name,
    body.password,
    body.phone ?? null,
  );
  return NextResponse.json(result);
}
