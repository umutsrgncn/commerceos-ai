import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Hostname subdomain'i shop.* ise istek path'inin başına /shop ekleyerek
 * internal rewrite yapar. Kullanıcı URL'de bunu görmez.
 * Dev'de http://localhost:3000/shop ile aynı sonuca ulaşılır.
 */
function shopSubdomainRewrite(req: NextRequest): NextResponse | null {
  const host = req.headers.get("host") ?? "";
  const isShopSubdomain = host.startsWith("shop.");
  if (!isShopSubdomain) return null;

  const url = req.nextUrl.clone();
  // Zaten /shop ile başlıyorsa noop
  if (url.pathname === "/shop" || url.pathname.startsWith("/shop/")) return null;
  url.pathname = `/shop${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export default auth((req) => {
  const rewrite = shopSubdomainRewrite(req as unknown as NextRequest);
  if (rewrite) return rewrite;
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)",
  ],
};
