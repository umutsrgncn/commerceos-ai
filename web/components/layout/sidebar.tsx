"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();

  const main = NAV_ITEMS.filter((item) => item.group === "main");
  const ai = NAV_ITEMS.filter((item) => item.group === "ai");

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-bg)] md:flex">
      <Link
        href="/admin"
        className="flex h-16 items-center gap-2 px-5 text-lg font-semibold tracking-tight"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
          ⌘
        </span>
        CommerceOS
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {main.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="mt-6 mb-1 px-3 text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
          AI
        </div>
        {ai.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
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
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[color:var(--color-fg)]/[0.06] font-medium text-[color:var(--color-fg)]"
          : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.04] hover:text-[color:var(--color-fg)]"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
