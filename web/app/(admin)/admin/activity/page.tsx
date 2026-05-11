import Link from "next/link";
import {
  Building,
  CircleAlert,
  Coins,
  Edit3,
  FileUp,
  Link2,
  MessageSquare,
  PackagePlus,
  Receipt,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
// Sparkles + Building yukarıda zaten import edildi (otopilot/tedarikçi action'ları için)

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listActivity } from "@/lib/queries/activity";
import { formatRelativeTime, formatMoney } from "@/lib/format";

export const metadata = { title: "Etkinlik — CommerceOS" };

type Variant =
  | "create"
  | "update"
  | "delete"
  | "refund"
  | "transition"
  | "money"
  | "review"
  | "neutral";

const STATUS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandı",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
};

const trStatus = (s: string) => STATUS_TR[s] ?? s;

const ACTION_META: Record<
  string,
  {
    label: (m: Record<string, unknown>) => string;
    icon: LucideIcon;
    variant: Variant;
    href?: (id: string) => string;
  }
> = {
  // ─── Ürünler ───
  "product.create": {
    label: (m) => `Yeni ürün eklendi: ${(m.name as string) ?? "?"}`,
    icon: PackagePlus,
    variant: "create",
    href: (id) => `/admin/products/${id}`,
  },
  "product.update": {
    label: (m) => `Ürün güncellendi: ${(m.name as string) ?? "?"}`,
    icon: Edit3,
    variant: "update",
    href: (id) => `/admin/products/${id}`,
  },
  "product.delete": {
    label: (m) => `Ürün silindi: ${(m.name as string) ?? "?"}`,
    icon: Trash2,
    variant: "delete",
  },

  // ─── Siparişler ───
  "order.create": {
    label: (m) => `Yeni sipariş açıldı: ${(m.orderNumber as string) ?? "?"}`,
    icon: PackagePlus,
    variant: "create",
    href: (id) => `/admin/orders/${id}`,
  },
  "order.transition": {
    label: (m) =>
      `Sipariş durumu değişti: ${trStatus((m.from as string) ?? "?")} → ${trStatus((m.to as string) ?? "?")}`,
    icon: RefreshCw,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },

  // ─── İade ───
  "refund.create": {
    label: (m) =>
      `İade kaydı: ${formatMoney(Number(m.amount ?? 0), "TRY")}`,
    icon: Coins,
    variant: "refund",
    href: (id) => `/admin/orders/${id}`,
  },

  // ─── Yorum ───
  "review.create": {
    label: (m) => `Yorum eklendi (${(m.rating as number) ?? "?"} ★)`,
    icon: Star,
    variant: "review",
    href: (id) => `/admin/products/${id}`,
  },
  "review.reply": {
    label: () => `Yoruma cevap yazıldı`,
    icon: MessageSquare,
    variant: "review",
    href: (id) => `/admin/products/${id}`,
  },
  "review.delete": {
    label: () => `Yorum silindi`,
    icon: Trash2,
    variant: "delete",
  },

  // ─── Finans ───
  "expense.create": {
    label: (m) => {
      const amount = Number(m.amount ?? 0);
      const cat = (m.category as string) ?? "";
      return `Gider eklendi: ${formatMoney(amount, "TRY")}${cat ? ` (${cat})` : ""}`;
    },
    icon: Wallet,
    variant: "money",
    href: (id) => `/admin/expenses/${id}`,
  },
  "invoice.issued": {
    label: (m) => {
      const num = (m.invoiceNumber as string) ?? "?";
      const mode = (m.mode as string) ?? "";
      const dt = (m.documentType as string) ?? "EFATURA";
      const docLabel = dt === "EARSIV" ? "E-arşiv" : "E-fatura";
      return `${docLabel} kesildi: ${num}${mode === "test" ? " (test)" : ""}`;
    },
    icon: Receipt,
    variant: "money",
    href: (id) => `/admin/orders/${id}`,
  },
  "invoice.failed": {
    label: (m) => `E-fatura reddedildi: ${(m.invoiceNumber as string) ?? "?"}`,
    icon: CircleAlert,
    variant: "delete",
    href: (id) => `/admin/orders/${id}`,
  },
  "invoice.reissued": {
    label: (m) => {
      const num = (m.invoiceNumber as string) ?? "?";
      const mode = (m.mode as string) ?? "";
      return `Fatura yeniden gönderildi: ${num}${mode === "test" ? " (test)" : ""}`;
    },
    icon: Receipt,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },
  "invoice.cancelled": {
    label: (m) => {
      const num = (m.invoiceNumber as string) ?? "?";
      const reason = m.reason as string | null;
      return reason
        ? `Fatura iptal edildi: ${num} — ${reason}`
        : `Fatura iptal edildi: ${num}`;
    },
    icon: CircleAlert,
    variant: "delete",
    href: (id) => `/admin/orders/${id}`,
  },

  // ─── Banka entegrasyonu ───
  "bank.import": {
    label: (m) => {
      const imp = (m.imported as number) ?? 0;
      const auto = (m.autoMatched as number) ?? 0;
      const bank = (m.bankName as string) ?? "";
      return `Banka extresi içe aktarıldı${bank ? ` (${bank})` : ""}: ${imp} işlem, ${auto} AI eşleşti`;
    },
    icon: FileUp,
    variant: "transition",
    href: () => `/admin/bank`,
  },
  "invoice.bulk_issue": {
    label: (m) => {
      const att = (m.attempted as number) ?? 0;
      const ok = (m.succeeded as number) ?? 0;
      const fail = (m.failed as number) ?? 0;
      return `Toplu e-fatura: ${att} sipariş, ${ok} kesildi${fail > 0 ? `, ${fail} hata` : ""}`;
    },
    icon: Receipt,
    variant: "money",
    href: () => `/admin/invoices`,
  },
  "order.shipped": {
    label: (m) => {
      const num = (m.orderNumber as string) ?? "?";
      const carrier = (m.carrier as string) ?? "";
      return `Sipariş kargoya verildi: ${num}${carrier ? ` (${carrier})` : ""}`;
    },
    icon: PackagePlus,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },
  "order.delivered": {
    label: (m) => `Sipariş teslim edildi: ${(m.orderNumber as string) ?? "?"}`,
    icon: PackagePlus,
    variant: "money",
    href: (id) => `/admin/orders/${id}`,
  },
  "expense.recurring_generate": {
    label: (m) => {
      const g = (m.generated as number) ?? 0;
      const s = (m.skipped as number) ?? 0;
      return `Tekrarlayan giderler üretildi: ${g} yeni, ${s} atlandı`;
    },
    icon: RefreshCw,
    variant: "money",
    href: () => `/admin/expenses`,
  },
  "autopilot.review_flagged": {
    label: (m) => {
      const reason = (m.flagReason as string) ?? "?";
      return `Otopilot yorum flag'ledi: ${reason}`;
    },
    icon: Sparkles,
    variant: "delete",
    href: () => `/admin/reviews`,
  },
  "autopilot.order_confirmed": {
    label: (m) =>
      `Otopilot siparişi onayladı: ${(m.orderNumber as string) ?? "?"}`,
    icon: Sparkles,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },
  "autopilot.customer_segmented": {
    label: (m) => {
      const seg = (m.segment as string) ?? "?";
      const conf = m.confidence as number | undefined;
      return `Otopilot müşteri segmentledi: ${seg}${conf ? ` (%${conf})` : ""}`;
    },
    icon: Sparkles,
    variant: "transition",
    href: (id) => `/admin/customers/${id}`,
  },
  "autopilot.price_scan": {
    label: (m) => {
      const sc = (m.scanned as number) ?? 0;
      const sg = (m.suggested as number) ?? 0;
      return `Otopilot fiyat tarayıcısı: ${sc} ürün, ${sg} öneri`;
    },
    icon: Sparkles,
    variant: "money",
    href: () => `/admin/autopilot`,
  },
  "payment.link_created": {
    label: (m) => {
      const num = (m.orderNumber as string) ?? "?";
      const mode = (m.mode as string) ?? "test";
      return `Ödeme linki oluşturuldu: ${num} (iyzico ${mode})`;
    },
    icon: Coins,
    variant: "transition",
    href: (id) => `/admin/orders/${id}`,
  },
  "payment.captured": {
    label: (m) => {
      const amt = (m.amountMinor as number) ?? 0;
      return `Ödeme tahsil edildi: ${formatMoney(amt, "TRY")}`;
    },
    icon: Coins,
    variant: "money",
    href: (id) => `/admin/orders/${id}`,
  },
  "payment.failed": {
    label: (m) => `Ödeme başarısız: ${(m.reason as string) ?? "?"}`,
    icon: CircleAlert,
    variant: "delete",
    href: (id) => `/admin/orders/${id}`,
  },
  "kvkk.deletion_requested": {
    label: (m) => `Veri silme talebi: ${(m.email as string) ?? "?"}`,
    icon: Shield,
    variant: "create",
    href: () => `/admin/data-requests`,
  },
  "kvkk.deletion_approved": {
    label: () => `Veri silme talebi onaylandı`,
    icon: ShieldCheck,
    variant: "transition",
    href: () => `/admin/data-requests`,
  },
  "kvkk.deletion_rejected": {
    label: () => `Veri silme talebi reddedildi`,
    icon: Shield,
    variant: "delete",
    href: () => `/admin/data-requests`,
  },
  "kvkk.deletion_completed": {
    label: () => `Veri silme tamamlandı`,
    icon: ShieldCheck,
    variant: "delete",
    href: () => `/admin/data-requests`,
  },
  "kvkk.settings_updated": {
    label: () => `KVKK ayarları güncellendi`,
    icon: Shield,
    variant: "update",
    href: () => `/admin/settings/kvkk`,
  },
  "customer.address_added": {
    label: () => `Müşteri adresi eklendi`,
    icon: PackagePlus,
    variant: "create",
    href: (id) => `/admin/customers/${id}`,
  },
  "customer.address_removed": {
    label: () => `Müşteri adresi silindi`,
    icon: Trash2,
    variant: "delete",
    href: (id) => `/admin/customers/${id}`,
  },
  "user.invited": {
    label: (m) =>
      `Yeni kullanıcı: ${(m.email as string) ?? "?"} (${(m.role as string) ?? "?"})`,
    icon: PackagePlus,
    variant: "create",
    href: () => `/admin/users`,
  },
  "user.role_changed": {
    label: (m) => `Kullanıcı rolü değişti → ${(m.newRole as string) ?? "?"}`,
    icon: Edit3,
    variant: "update",
    href: () => `/admin/users`,
  },
  "user.deleted": {
    label: () => `Kullanıcı silindi`,
    icon: Trash2,
    variant: "delete",
    href: () => `/admin/users`,
  },
  "campaign.email_sent": {
    label: (m) => {
      const segment = (m.segment as string) ?? "?";
      const sent = (m.sent as number) ?? 0;
      return `E-posta kampanyası gönderildi: ${segment} (${sent} kişi)`;
    },
    icon: MessageSquare,
    variant: "money",
    href: () => `/admin/customers/campaign`,
  },
  "campaign.dead_stock_apply": {
    label: (m) => {
      const code = (m.discountCode as string) ?? "?";
      const pct = (m.discountPct as number) ?? 0;
      const product = (m.productName as string) ?? "?";
      return `Yavaş stok kampanyası başlatıldı: ${product} → ${code} (%${pct})`;
    },
    icon: Sparkles,
    variant: "money",
    href: () => `/admin/discounts`,
  },
  "supplier.create": {
    label: (m) => {
      const name = (m.name as string) ?? "?";
      const cnt = (m.productCount as number) ?? 0;
      return `Tedarikçi eklendi: ${name}${cnt > 0 ? ` (${cnt} SKU)` : ""}`;
    },
    icon: Building,
    variant: "create",
    href: () => "/admin/suppliers",
  },
  "autopilot.review_reply": {
    label: (m) => {
      const conf = m.confidence as number | undefined;
      return `Otopilot yorum cevabı yazdı${conf ? ` (%${conf})` : ""}`;
    },
    icon: Sparkles,
    variant: "transition",
    href: (id) => `/admin/reviews?productId=${id}`,
  },
  "autopilot.invoice_issued": {
    label: (m) => {
      const num = (m.invoiceNumber as string) ?? "?";
      const dt = (m.documentType as string) ?? "EFATURA";
      const docLabel = dt === "EARSIV" ? "E-arşiv" : "E-fatura";
      return `Otopilot ${docLabel} kesti: ${num}`;
    },
    icon: Sparkles,
    variant: "money",
    href: (id) => `/admin/orders/${id}`,
  },
  "autopilot.stock_reorder": {
    label: (m) => {
      const supplier = (m.supplierName as string) ?? "?";
      const ordered = (m.orderedQty as number) ?? 0;
      const product = (m.productName as string) ?? "?";
      return `Otopilot tedarikçiye sipariş yazdı: ${supplier} → ${product} ${ordered} adet`;
    },
    icon: Sparkles,
    variant: "transition",
    href: () => "/admin/autopilot",
  },
  "bank.matched": {
    label: (m) => {
      const auto = m.auto === true;
      const amount = (m.amountMinor as number) ?? 0;
      const conf = m.confidence as number | undefined;
      const sign = auto ? "AI" : "Manuel";
      return `${sign} eşleştirdi: ${formatMoney(amount, "TRY")}${
        conf ? ` (%${conf})` : ""
      }`;
    },
    icon: Link2,
    variant: "money",
    href: (id) => `/admin/orders/${id}`,
  },

  // ─── Kullanıcı ───
  "user.profile.update": {
    label: () => `Profil güncellendi`,
    icon: Edit3,
    variant: "update",
  },
  "user.password.change": {
    label: () => `Şifre değiştirildi`,
    icon: Edit3,
    variant: "update",
  },
};

const VARIANT_STYLES: Record<Variant, string> = {
  create: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  update: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  delete: "bg-red-500/10 text-red-600 dark:text-red-400",
  refund: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  transition: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  money: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  review: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  neutral: "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
};

export default async function ActivityPage() {
  const items = await listActivity(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Etkinlik akışı</h1>
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
                const label = meta ? meta.label(metadata) : item.action;
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
                      <div className="text-sm">{label}</div>
                      <div className="text-xs text-[color:var(--color-muted)]">
                        {item.userName ?? "Sistem"} ·{" "}
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </div>
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
