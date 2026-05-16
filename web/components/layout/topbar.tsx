import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { TopbarSearch } from "./topbar-search";
import type { Theme } from "@/lib/theme";

export function Topbar({
  user,
  theme,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  theme: Theme;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 px-3 sm:px-6 backdrop-blur-xl">
      <TopbarSearch />

      <div className="flex items-center gap-1 ml-auto">
        <NotificationBell />
        <ThemeToggle initial={theme} />
        <span className="mx-1 hidden h-5 w-px bg-[color:var(--color-border)] sm:block" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
