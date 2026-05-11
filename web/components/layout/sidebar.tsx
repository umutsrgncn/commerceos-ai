"use client";

/**
 * Responsive sidebar:
 * - Mobile (< md): w-14 icon-only, label tooltip
 * - Desktop (md+): w-60 icon + label
 *
 * Always visible — drawer/hamburger karmaşıklığı yok.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

function visibleFor(role: string | undefined) {
  return NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true;
    const userRank = ROLE_RANK[role ?? ""] ?? 0;
    const required = ROLE_RANK[item.minRole];
    return userRank >= required;
  });
}

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const items = visibleFor(userRole);

  const main = items.filter((item) => item.group === "main");
  const finance = items.filter((item) => item.group === "finance");
  const ai = items.filter((item) => item.group === "ai");
  const system = items.filter((item) => item.group === "system");

  return (
    <aside className="flex sticky top-0 h-screen w-14 md:w-60 shrink-0 flex-col self-start border-r border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
      <Link
        href="/admin"
        className="flex h-16 shrink-0 items-center justify-center gap-2 px-2 md:justify-start md:px-5 text-lg font-semibold tracking-tight"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm shrink-0">
          ⌘
        </span>
        <span className="hidden md:inline">CommerceOS</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 md:p-3">
        {main.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        {finance.length > 0 && (
          <>
            <div className="mt-4 md:mt-6 mb-1 px-1 md:px-3 hidden md:block text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
              Finans
            </div>
            <div className="mt-4 md:hidden h-px bg-[color:var(--color-border)] mx-2" />
            {finance.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </>
        )}

        <div className="mt-4 md:mt-6 mb-1 px-1 md:px-3 hidden md:block text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
          AI
        </div>
        <div className="mt-4 md:hidden h-px bg-[color:var(--color-border)] mx-2" />
        {ai.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      {system.length > 0 && (
        <div className="shrink-0 border-t border-[color:var(--color-border)] p-2 md:p-3">
          {system.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function NavLink({ item, active }: { item: (typeof NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2 md:px-3 transition-colors text-sm",
        "justify-center md:justify-start",
        active
          ? "bg-[color:var(--color-fg)]/[0.06] font-medium text-[color:var(--color-fg)]"
          : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.04] hover:text-[color:var(--color-fg)]",
      )}
    >
      <Icon className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
      <span className="hidden md:inline">{item.label}</span>
    </Link>
  );
}
