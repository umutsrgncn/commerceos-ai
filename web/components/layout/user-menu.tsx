"use client";

import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/session";

export function UserMenu({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
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
            </div>
            <div className="my-1 h-px bg-[color:var(--color-border)]" />
            <Menu.Item
              value="profile"
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[color:var(--color-fg)]/[0.06]"
            >
              <UserIcon className="h-4 w-4" />
              Profil
            </Menu.Item>
            <Menu.Item
              value="settings"
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[color:var(--color-fg)]/[0.06]"
            >
              <Settings className="h-4 w-4" />
              Ayarlar
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
