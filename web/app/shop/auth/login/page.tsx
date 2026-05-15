import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCustomer, safeShopRedirect } from "@/lib/shop/auth";
import { LoginForm } from "./components/login-form";

export const metadata = { title: "Giriş · Pamuk" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeShopRedirect(sp.next, "/shop/account");

  // Zaten giriş yapmışsa hesabına yönlendir
  const current = await getCurrentCustomer();
  if (current) redirect(next);

  return (
    <div className="mx-auto max-w-md px-6 py-16 lg:py-24">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          Hoş geldin
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95]">
          Giriş yap
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          Sipariş takip, favoriler ve adres yönetimi için.
        </p>
      </div>

      <div className="mt-10">
        <LoginForm next={next} />
      </div>

      <p className="mt-8 text-center text-sm text-[color:var(--color-muted)]">
        Hesabın yok mu?{" "}
        <Link
          href={`/shop/auth/register?next=${encodeURIComponent(next)}` as never}
          className="font-medium text-[color:var(--color-accent)] underline-offset-4 hover:underline"
        >
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
