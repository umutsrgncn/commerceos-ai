import Link from "next/link";
import { LogOut, MapPin, Package, Settings, User, Heart } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { logoutAction } from "@/lib/shop/auth-actions";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await requireCustomer("/shop/account");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
      {/* Hero — kullanıcı kartı */}
      <header className="mb-10 rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-accent)]/[0.05] via-[color:var(--color-surface)] to-transparent p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] font-display text-xl italic">
              {customer.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                Hoş geldin
              </p>
              <h1 className="mt-1 font-display text-3xl italic leading-tight">
                {customer.name}
              </h1>
              <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                {customer.email}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs font-medium text-[color:var(--color-muted)] transition hover:border-red-500/30 hover:text-red-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış yap
            </button>
          </form>
        </div>
      </header>

      {/* Layout: sidebar nav + content */}
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <aside className="lg:col-span-3">
          <nav className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
            <NavItem href="/shop/account" icon={<User className="h-4 w-4" />} label="Profil" />
            <NavItem href="/shop/account/orders" icon={<Package className="h-4 w-4" />} label="Siparişlerim" />
            <NavItem href="/shop/account/addresses" icon={<MapPin className="h-4 w-4" />} label="Adreslerim" />
            <NavItem href="/shop/account/wishlist" icon={<Heart className="h-4 w-4" />} label="Favoriler" />
            <NavItem href="/shop/account/settings" icon={<Settings className="h-4 w-4" />} label="Ayarlar" />
          </nav>
        </aside>

        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[color:var(--color-fg)]/80 transition hover:bg-[color:var(--color-fg)]/[0.04] hover:text-[color:var(--color-fg)]"
    >
      <span className="text-[color:var(--color-muted)]">{icon}</span>
      {label}
    </Link>
  );
}
