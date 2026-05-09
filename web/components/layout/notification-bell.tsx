"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import {
  Bell,
  Coins,
  PackagePlus,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

const READ_AT_KEY = "commerceos:notifications:lastReadAt";

type Item = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type Resp = { items: Item[] };

const ACTION_META: Record<
  string,
  { label: (m: Record<string, unknown>) => string; icon: LucideIcon; href?: (id: string) => string }
> = {
  "product.create": {
    label: (m) => `Ürün eklendi — ${(m.name as string) ?? "?"}`,
    icon: PackagePlus,
    href: (id) => `/admin/products/${id}`,
  },
  "product.delete": {
    label: (m) => `Ürün silindi — ${(m.name as string) ?? "?"}`,
    icon: Trash2,
  },
  "order.create": {
    label: (m) => `Yeni sipariş — ${(m.orderNumber as string) ?? "?"}`,
    icon: PackagePlus,
    href: (id) => `/admin/orders/${id}`,
  },
  "order.transition": {
    label: (m) => `Durum: ${(m.from as string) ?? "?"} → ${(m.to as string) ?? "?"}`,
    icon: RefreshCw,
    href: (id) => `/admin/orders/${id}`,
  },
  "refund.create": {
    label: (m) => `İade — ${((m.amount as number) ?? 0) / 100}₺`,
    icon: Coins,
    href: (id) => `/admin/orders/${id}`,
  },
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  return `${days} gün`;
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = Number(localStorage.getItem(READ_AT_KEY)) || 0;
    setLastReadAt(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Resp;
        if (!cancelled) setItems(data.items);
      } catch {
        // silently ignore — bell is non-critical
      }
    }
    load();
    const id = setInterval(load, 30_000); // poll every 30s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const unreadCount = items.filter(
    (it) => new Date(it.createdAt).getTime() > lastReadAt
  ).length;

  function markAllRead() {
    const now = Date.now();
    setLastReadAt(now);
    localStorage.setItem(READ_AT_KEY, String(now));
  }

  return (
    <Menu.Root
      open={open}
      onOpenChange={(d) => {
        setOpen(d.open);
        if (d.open) markAllRead();
      }}
    >
      <Menu.Trigger
        className="relative grid h-9 w-9 place-items-center rounded-lg text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-fg)]/[0.05] hover:text-[color:var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
        aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner className="z-40">
          <Menu.Content className="w-80 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-lg outline-none">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
              <span className="text-sm font-semibold">Bildirimler</span>
              <Link
                href="/admin/activity"
                className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:underline"
              >
                Tüm akış
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[color:var(--color-muted)]">
                Henüz bildirim yok.
              </div>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {items.map((it) => {
                  const meta = ACTION_META[it.action];
                  const Icon = meta?.icon ?? Bell;
                  const metadata = it.metadata ?? {};
                  const label = meta ? meta.label(metadata) : it.action;
                  const href =
                    meta?.href && it.entityId ? meta.href(it.entityId) : null;
                  const unread = new Date(it.createdAt).getTime() > lastReadAt;

                  const Inner = (
                    <div
                      className={cn(
                        "flex items-start gap-3 border-b border-[color:var(--color-border)] px-4 py-3 last:border-b-0 transition",
                        "hover:bg-[color:var(--color-fg)]/[0.03]",
                        unread && "bg-fuchsia-500/[0.04]"
                      )}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">{label}</div>
                        <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                          {it.userName ?? "Sistem"} · {relativeTime(it.createdAt)}
                        </div>
                      </div>
                      {unread && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                      )}
                    </div>
                  );

                  return (
                    <li key={it.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="block"
                        >
                          {Inner}
                        </Link>
                      ) : (
                        Inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
