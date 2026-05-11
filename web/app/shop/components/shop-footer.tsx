import Link from "next/link";
import { ArrowRight, Instagram, Twitter, Youtube } from "lucide-react";

export function ShopFooter() {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] mt-32">
      {/* Newsletter band */}
      <div className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <h3 className="font-display text-3xl italic leading-tight sm:text-4xl">
              Yeni koleksiyondan
              <br />
              ilk haberi alın.
            </h3>
            <p className="mt-3 max-w-md text-sm text-[color:var(--color-muted)]">
              Ayda bir bülten. Yeni ürün, özel indirim ve atölye notları —
              spam yok, istediğiniz an çıkın.
            </p>
          </div>
          <form className="flex max-w-md gap-2 lg:justify-self-end">
            <input
              type="email"
              required
              placeholder="e-posta@adresiniz.com"
              className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-3 text-sm placeholder:text-[color:var(--color-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-fg)] px-5 py-3 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]"
            >
              Kayıt ol
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Link kolonları */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/shop" className="font-display text-2xl italic">
            Pamuk<span className="text-[color:var(--color-accent)]">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-[color:var(--color-muted)] leading-relaxed">
            2018'den bu yana doğal kumaş, sade kesim. İstanbul'da tasarlanır,
            Anadolu'da dokunur.
          </p>
          <div className="mt-5 flex gap-1">
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.04]"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.04]"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.04]"
              aria-label="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FooterColumn
          title="Alışveriş"
          links={[
            { href: "/shop/c/tisort", label: "Tişört" },
            { href: "/shop/c/pantolon", label: "Pantolon" },
            { href: "/shop/c/ayakkabi", label: "Ayakkabı" },
            { href: "/shop/c/canta", label: "Çanta" },
            { href: "/shop/c", label: "Tüm kategoriler →" },
          ]}
        />
        <FooterColumn
          title="Hesap"
          links={[
            { href: "/shop/account", label: "Profilim" },
            { href: "/shop/account/orders", label: "Siparişlerim" },
            { href: "/shop/account/wishlist", label: "Favoriler" },
            { href: "/auth/login", label: "Giriş yap" },
          ]}
        />
        <FooterColumn
          title="Yardım"
          links={[
            { href: "/shop/yardim", label: "Sıkça sorulanlar" },
            { href: "/shop/iade", label: "İade & Değişim" },
            { href: "/shop/kargo", label: "Kargo & teslimat" },
            { href: "/shop/kvkk", label: "KVKK" },
            { href: "/shop/iletisim", label: "İletişim" },
          ]}
        />
      </div>

      {/* Alt bant */}
      <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[11px] text-[color:var(--color-muted)]">
          <span>© 2026 Pamuk Tekstil A.Ş. · Tüm hakları saklıdır.</span>
          <span className="font-mono">
            CommerceOS · v1.0 · İstanbul
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href as never}
              className="text-[color:var(--color-fg)]/85 hover:text-[color:var(--color-fg)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
