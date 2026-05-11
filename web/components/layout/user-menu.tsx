"use client";

import Link from "next/link";
import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/session";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Yönetici",
  MANAGER: "Operasyon",
  VIEWER: "İzleyici",
};

const ROLE_TONE: Record<string, string> = {
  ADMIN: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  MANAGER: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  VIEWER: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
};

export function UserMenu({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}) {
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[color:var(--color-fg)]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
        aria-label="Hesap menüsü"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
          {initials}
        </span>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner className="z-40">
          <Menu.Content className="min-w-56 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-1.5 shadow-lg outline-none">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.name ?? "Kullanıcı"}</p>
              {user.email && (
                <p className="truncate text-xs text-[color:var(--color-muted)]">
                  {user.email}
                </p>
              )}
              {user.role && (
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${ROLE_TONE[user.role] ?? ROLE_TONE.VIEWER}`}
                >
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              )}
            </div>
            <div className="my-1 h-px bg-[color:var(--color-border)]" />
            <Menu.Item value="profile" asChild>
              <Link
                href="/admin/profile"
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[color:var(--color-fg)]/[0.06]"
              >
                <UserIcon className="h-4 w-4" />
                Profil
              </Link>
            </Menu.Item>
            <Menu.Item value="settings" asChild>
              <Link
                href="/admin/settings"
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[color:var(--color-fg)]/[0.06]"
              >
                <Settings className="h-4 w-4" />
                Ayarlar
              </Link>
            </Menu.Item>
            <div className="my-1 h-px bg-[color:var(--color-border)]" />
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Çıkış yap
              </button>
            </form>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
