import Link from "next/link";
import {
  CircleAlert,
  Coins,
  Edit3,
  PackagePlus,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listActivity } from "@/lib/queries/activity";
import { formatRelativeTime } from "@/lib/format";

export const metadata = { title: "Etkinlik — CommerceOS" };

type Variant = "create" | "update" | "delete" | "refund" | "transition" | "neutral";

const ACTION_META: Record<
  string,
  { label: (m: Record<string, unknown>) => string; icon: LucideIcon; variant: Variant; href?: (id: string) => string }
> = {
  "product.create": {
    label: (m) => `Ürün oluşturuldu — ${(m.name as string) ?? "?"}`,
    icon: PackagePlus,
    variant: "create",
    href: (id) => `/admin/products/${id}`,
  },
  "product.update": {
    label: (m) => `Ürün güncellendi — ${(m.name as string) ?? "?"}`,
    icon: Edit3,
    variant: "update",
    href: (id) => `/admin/products/${id}`,
  },
  "product.delete": {
    label: (m) => `Ürün silindi — ${(m.name as string) ?? "?"}`,
    icon: Trash2,
    variant: "delete",
  },
  "order.create": {
    label: (m) => `Sipariş açıldı — ${(m.orderNumber as string) ?? "?"}`,
    icon: PackagePlus,
    variant: "create",
    href: (id) => `/admin/orders/${id}`,
  },
  "order.transition": {
    label: (m) => `Durum: ${(m.from as string) ?? "?"} → ${(m.to as string) ?? "?"}`,
    icon: RefreshCw,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },
  "refund.create": {
    label: (m) => `İade açıldı — ${(m.amount as number) ?? 0} kuruş`,
    icon: Coins,
    variant: "refund",
    href: (id) => `/admin/orders/${id}`,
  },
};

const VARIANT_STYLES: Record<Variant, string> = {
  create: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  update: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  delete: "bg-red-500/10 text-red-600 dark:text-red-400",
  refund: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  transition: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  neutral: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
};

export default async function ActivityPage() {
  const items = await listActivity(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Etkinlik akışı</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Yöneticilerin son işlemleri — denetim ve hızlı geri sarma için.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son {items.length} işlem</CardTitle>
          <CardDescription>
            En yeni en üstte. Sonsuz değil — eski kayıtlar 100&apos;den sonra kesilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[color:var(--color-muted)]">
              Henüz kayıt yok. Bir ürün oluştur, ekle, durumu değiştir →
              burada görünecek.
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {items.map((item) => {
                const meta = ACTION_META[item.action];
                const metadata =
                  (item.metadata as Record<string, unknown> | null) ?? {};
                const Icon = meta?.icon ?? CircleAlert;
                const variant = meta?.variant ?? "neutral";
                const label = meta
                  ? meta.label(metadata)
                  : item.action;
                const href =
                  meta?.href && item.entityId ? meta.href(item.entityId) : null;

                const Inner = (
                  <div className="flex items-start gap-3 px-6 py-4 transition hover:bg-[color:var(--color-fg)]/[0.025]">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${VARIANT_STYLES[variant]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-[color:var(--color-muted)]">
                        {item.userName ?? "Bilinmeyen kullanıcı"} ·{" "}
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </div>
                    <span className="rounded-full bg-[color:var(--color-fg)]/[0.04] px-2 py-0.5 text-[10px] font-mono text-[color:var(--color-muted)]">
                      {item.action}
                    </span>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {href ? <Link href={href}>{Inner}</Link> : Inner}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

