import { Search } from "lucide-react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import type { Theme } from "@/lib/theme";

export function Topbar({
  user,
  theme,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  theme: Theme;
}) {
  return (
    <header className="sticky top-0 z-30 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 px-6 backdrop-blur-xl">
      {/* Sol spacer — search'ün ortalanması için */}
      <div />

      <div className="relative w-full max-w-md justify-self-center">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
        <input
          placeholder="Ara…"
          className="h-9 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] pl-9 pr-12 text-sm placeholder:text-[color:var(--color-muted)] transition focus-visible:border-[color:var(--color-accent)]/50 focus-visible:bg-[color:var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/20"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-muted)] sm:inline-flex">
          /
        </kbd>
      </div>

      <div className="flex items-center justify-self-end gap-1">
        <NotificationBell />
        <ThemeToggle initial={theme} />
        <span className="mx-1 h-5 w-px bg-[color:var(--color-border)]" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
