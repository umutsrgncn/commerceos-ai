import Link from "next/link";

import { CookieBanner } from "@/components/layout/cookie-banner";
import { CommerceOSLogo } from "@/components/brand/logo";
import { getSettings } from "@/lib/queries/settings";
import { readTheme } from "@/lib/theme";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, theme] = await Promise.all([getSettings(), readTheme()]);

  return (
    <div
      className="min-h-screen flex flex-col"
      data-public
      {...(theme && { "data-theme": theme })}
    >
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <CommerceOSLogo size={24} />
            {settings.companyName ?? "CommerceOS"}
          </Link>
          <nav className="flex items-center gap-3 text-xs text-[color:var(--color-muted)]">
            <Link href="/privacy" className="hover:text-[color:var(--color-fg)]">
              Aydınlatma metni
            </Link>
            <Link
              href="/data-deletion"
              className="hover:text-[color:var(--color-fg)]"
            >
              Veri silme
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-[color:var(--color-border)] py-4">
        <div className="mx-auto w-full max-w-3xl px-4 text-[10px] text-[color:var(--color-muted)]">
          {settings.companyName && (
            <>
              {settings.companyName}
              {settings.taxId && ` · VKN ${settings.taxId}`}
            </>
          )}
        </div>
      </footer>
      <CookieBanner enabled={settings.cookieBannerEnabled} />
    </div>
  );
}
