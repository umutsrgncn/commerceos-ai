/**
 * Statik bilgi sayfaları (yardım, iade, kargo, kvkk, iletişim) için ortak layout.
 * Route group (info) — URL'i etkilemez.
 */
import Link from "next/link";

const INFO_PAGES = [
  { href: "/shop/yardim", label: "Sıkça sorulanlar" },
  { href: "/shop/iade", label: "İade & değişim" },
  { href: "/shop/kargo", label: "Kargo & teslimat" },
  { href: "/shop/kvkk", label: "KVKK aydınlatma" },
  { href: "/shop/iletisim", label: "İletişim" },
];

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Sol — bilgi sayfaları nav */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              Yardım merkezi
            </p>
            <nav className="mt-4 space-y-1">
              {INFO_PAGES.map((p) => (
                <Link
                  key={p.href}
                  href={p.href as never}
                  className="block rounded-md px-3 py-2 text-sm text-[color:var(--color-fg)]/80 transition hover:bg-[color:var(--color-fg)]/[0.04] hover:text-[color:var(--color-fg)]"
                >
                  {p.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 rounded-xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                Hâlâ soru var mı?
              </p>
              <p className="mt-2 text-xs text-[color:var(--color-muted)] leading-relaxed">
                Çözemediğin bir konu için doğrudan bize yaz, 1 iş günü içinde
                dönüş yapalım.
              </p>
              <Link
                href={"/shop/iletisim" as never}
                className="mt-3 inline-block text-xs font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline"
              >
                İletişime geç →
              </Link>
            </div>
          </div>
        </aside>

        {/* Sağ — içerik */}
        <main className="lg:col-span-9">
          <div className="prose-shop max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
}
