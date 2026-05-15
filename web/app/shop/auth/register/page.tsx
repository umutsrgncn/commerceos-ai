import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCustomer, safeShopRedirect } from "@/lib/shop/auth";
import { RegisterForm } from "./components/register-form";

export const metadata = { title: "Kayıt · Pamuk" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeShopRedirect(sp.next, "/shop/account");

  const current = await getCurrentCustomer();
  if (current) redirect(next);

  return (
    <div className="mx-auto max-w-md px-6 py-16 lg:py-24">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          Yeni hesap
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95]">
          Kayıt ol
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          Sadece e-posta, isim ve şifre. KVKK uyumlu.
        </p>
      </div>

      <div className="mt-10">
        <RegisterForm next={next} />
      </div>

      <p className="mt-8 text-center text-sm text-[color:var(--color-muted)]">
        Hesabın var mı?{" "}
        <Link
          href={`/shop/auth/login?next=${encodeURIComponent(next)}` as never}
          className="font-medium text-[color:var(--color-accent)] underline-offset-4 hover:underline"
        >
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
