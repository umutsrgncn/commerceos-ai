import { NextResponse } from "next/server";
import { addToCart, readCart } from "@/lib/shop/cart";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in prod" }, { status: 403 });
  }
  const body = await req.json();
  try {
    const cart = await addToCart(body.productId, body.quantity ?? 1);
    return NextResponse.json({ ok: true, cart });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in prod" }, { status: 403 });
  }
  return NextResponse.json(await readCart());
}
