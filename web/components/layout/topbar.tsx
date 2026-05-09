import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import type { Theme } from "@/lib/theme";

export function Topbar({
  user,
  theme,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  theme: Theme;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
        <Input
          placeholder="Ürün, sipariş veya müşteri ara…"
          className="pl-9"
        />
      </div>
      <ThemeToggle initial={theme} />
      <UserMenu user={user} />
    </header>
  );
}
