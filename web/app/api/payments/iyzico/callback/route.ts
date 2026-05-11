import { NextResponse, type NextRequest } from "next/server";

import { finalizePaymentAction } from "@/lib/actions/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico Checkout Form callback.
 *
 * iyzico müşteri ödemeyi tamamlayınca tarayıcıyı bu URL'ye yönlendirir
 * (POST). Body'de `token` ve `conversationId` gelir.
 *
 * Biz token ile iyzico'ya retrieve sorgusu yaparız, sonucu DB'ye yazarız,
 * kullanıcıyı sipariş detayına yönlendiririz.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = String(formData.get("token") ?? "");
  const conversationId = String(formData.get("conversationId") ?? "");

  if (!token) {
    return new NextResponse(html("Geçersiz callback (token yok)", null), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = await finalizePaymentAction({ token, conversationId });

  // Payment'tan order id'yi al
  const orderId = (
    await import("@/lib/db").then((m) => m.db)
  ).payment.findFirst({
    where: { gatewayToken: token },
    select: { orderId: true },
  });
  const oid = (await orderId)?.orderId ?? null;

  // Kullanıcıyı sipariş detayına yönlendir (HTML auto-redirect)
  const redirectUrl = oid
    ? `/admin/orders/${oid}?payment=${result.ok ? "success" : "failed"}`
    : `/admin?payment=${result.ok ? "success" : "failed"}`;

  return new NextResponse(html("Ödeme tamamlandı", redirectUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function html(message: string, redirectUrl: string | null): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Ödeme — CommerceOS</title>
  ${redirectUrl ? `<meta http-equiv="refresh" content="1;url=${redirectUrl}">` : ""}
  <style>
    body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff}
    .card{padding:32px;border:1px solid #333;border-radius:12px;text-align:center;max-width:400px}
    h1{margin:0 0 8px;font-size:18px}
    p{color:#999;margin:0;font-size:14px}
    a{color:#a855f7;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <h1>${message}</h1>
    ${redirectUrl ? `<p>Yönlendiriliyorsunuz... <a href="${redirectUrl}">Tıkla</a></p>` : ""}
  </div>
</body>
</html>`;
}
