import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Code,
  Receipt,
  TestTube2,
  User as UserIcon,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInvoiceById } from "@/lib/queries/invoices";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CopyButton } from "../components/copy-button";
import { InvoiceActions } from "../components/invoice-actions";

export const metadata = { title: "E-Fatura — CommerceOS" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  ACCEPTED: "Kabul edildi",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal",
};

const STATUS_VARIANT: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "warning",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const isTest = invoice.mode === "test";
  const accepted = invoice.status === "ACCEPTED";
  const rejected = invoice.status === "REJECTED";
  const cancelled = invoice.status === "CANCELLED";
  const isEArsiv = invoice.documentType === "EARSIV";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/invoices"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> E-Faturalar
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div
          className={cn(
            "h-2 w-full",
            accepted
              ? "bg-emerald-500"
              : rejected
                ? "bg-red-500"
                : cancelled
                  ? "bg-amber-500"
                  : "bg-indigo-500"
          )}
        />
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "grid h-14 w-14 shrink-0 place-items-center rounded-xl",
                accepted
                  ? "bg-emerald-500/10 text-emerald-500"
                  : rejected
                    ? "bg-red-500/10 text-red-500"
                    : cancelled
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-indigo-500/10 text-indigo-500"
              )}
            >
              <Receipt className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl sm:text-2xl font-semibold tracking-tight">
                  {invoice.invoiceNumber}
                </h1>
                <Badge variant={STATUS_VARIANT[invoice.status] ?? "neutral"}>
                  {STATUS_LABEL[invoice.status] ?? invoice.status}
                </Badge>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    isEArsiv
                      ? "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  )}
                  title={
                    isEArsiv
                      ? "B2C / son tüketici (bireysel)"
                      : "B2B / VKN'li alıcı (kurumsal)"
                  }
                >
                  {isEArsiv ? (
                    <UserIcon className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  {isEArsiv ? "E-ARŞİV" : "E-FATURA"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    isTest
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {isTest ? (
                    <>
                      <TestTube2 className="h-3 w-3" />
                      TEST
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      ÜRETİM
                    </>
                  )}
                </span>
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                Sipariş{" "}
                <Link
                  href={`/admin/orders/${invoice.orderId}`}
                  className="font-mono hover:underline"
                >
                  {invoice.order.orderNumber}
                </Link>{" "}
                · UUID:{" "}
                <span className="font-mono">{invoice.uuid.slice(0, 8)}…</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
              Toplam
            </div>
            <div className="text-3xl font-semibold tabular-nums">
              {formatMoney(invoice.totalMinor, invoice.currency)}
            </div>
            {invoice.taxMinor > 0 && (
              <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                KDV: {formatMoney(invoice.taxMinor, invoice.currency)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejected hatası varsa */}
      {invoice.errorMessage && (
        <Card className="border-red-500/30 bg-red-500/[0.04]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <div>
              <div className="font-medium text-red-700 dark:text-red-400">
                Entegratör hatası
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                {invoice.errorMessage}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İptal edildi banner */}
      {cancelled && (
        <Card className="border-amber-500/30 bg-amber-500/[0.04]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <XCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-medium text-amber-700 dark:text-amber-400">
                Bu fatura iptal edildi
              </div>
              {invoice.cancelReason && (
                <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                  Sebep: {invoice.cancelReason}
                </div>
              )}
              {invoice.cancelledAt && (
                <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                  {formatDate(invoice.cancelledAt)} ·{" "}
                  {invoice.cancelledAt.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol: müşteri ve sipariş */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Alıcı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{invoice.order.customer.name}</div>
              <div className="text-[color:var(--color-muted)]">
                {invoice.order.customer.email}
              </div>
              {invoice.order.customer.phone && (
                <div className="text-[color:var(--color-muted)]">
                  {invoice.order.customer.phone}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş kalemleri</CardTitle>
              <CardDescription>
                {invoice.order.items.length} kalem
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-6 py-2 text-left font-medium">Ürün</th>
                    <th className="px-4 py-2 text-right font-medium">Adet</th>
                    <th className="px-4 py-2 text-right font-medium">Birim</th>
                    <th className="px-6 py-2 text-right font-medium">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.order.items.map((it) => (
                    <tr
                      key={it.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0"
                    >
                      <td className="px-6 py-2.5">
                        <div className="font-medium">{it.name}</div>
                        {it.product?.sku && (
                          <div className="font-mono text-xs text-[color:var(--color-muted)]">
                            {it.product.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatMoney(it.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-6 py-2.5 text-right tabular-nums font-medium">
                        {formatMoney(it.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  UBL-TR XML
                </CardTitle>
                <CardDescription>
                  GİB'e gönderilen tam XML — UBL-TR 1.2 standardı
                </CardDescription>
              </div>
              <CopyButton text={invoice.ublXml} />
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.03] p-3 text-[10px] leading-relaxed text-[color:var(--color-muted)]">
                <code>{invoice.ublXml}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: işlemler + timeline */}
        <div className="space-y-6">
          {(invoice.status === "REJECTED" ||
            invoice.status === "SENT" ||
            invoice.status === "ACCEPTED") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">İşlemler</CardTitle>
                <CardDescription>
                  {invoice.status === "REJECTED"
                    ? "Reddedilen faturayı yeniden gönderebilirsin"
                    : "Faturayı iptal etmen gerekirse"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceActions
                  invoiceId={invoice.id}
                  status={invoice.status}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gönderim akışı</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-4 border-l border-[color:var(--color-border)]">
                <TimelineItem
                  done
                  title="Oluşturuldu"
                  date={invoice.createdAt}
                  detail="UBL-TR XML üretildi, DB'ye DRAFT kaydedildi"
                />
                {invoice.sentAt && (
                  <TimelineItem
                    done
                    title={
                      isTest ? "Test endpoint'e gönderildi" : "Entegratöre POST"
                    }
                    date={invoice.sentAt}
                    detail={
                      isTest
                        ? "Lokal mock yanıt — gerçek HTTP yapılmadı"
                        : "Entegratör URL'sine HTTP isteği"
                    }
                  />
                )}
                {invoice.acceptedAt && (
                  <TimelineItem
                    done
                    success
                    title="Kabul edildi"
                    date={invoice.acceptedAt}
                    detail={
                      isTest
                        ? "Mock ACCEPTED yanıtı"
                        : "Entegratör 2xx döndürdü"
                    }
                  />
                )}
                {rejected && (
                  <TimelineItem
                    done
                    error
                    title="Reddedildi"
                    date={invoice.updatedAt}
                    detail={invoice.errorMessage ?? "Bilinmeyen hata"}
                  />
                )}
                {cancelled && invoice.cancelledAt && (
                  <TimelineItem
                    done
                    warning
                    title="İptal edildi"
                    date={invoice.cancelledAt}
                    detail={
                      invoice.cancelReason ??
                      "Sebep belirtilmedi — fatura geçersiz sayılır"
                    }
                  />
                )}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detaylar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Row label="Fatura No" value={invoice.invoiceNumber} mono />
              <Row label="UUID" value={invoice.uuid} mono />
              <Row label="Belge tipi" value={isEArsiv ? "E-Arşiv" : "E-Fatura"} />
              <Row label="Mod" value={isTest ? "Test" : "Üretim"} />
              <Row label="Para birimi" value={invoice.currency} />
              <Row label="Oluşturuldu" value={formatDate(invoice.createdAt)} />
              {invoice.sentAt && (
                <Row label="Gönderildi" value={formatDate(invoice.sentAt)} />
              )}
              {invoice.acceptedAt && (
                <Row label="Kabul" value={formatDate(invoice.acceptedAt)} />
              )}
              {invoice.cancelledAt && (
                <Row label="İptal" value={formatDate(invoice.cancelledAt)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span
        className={cn(
          "max-w-[60%] truncate text-right",
          mono && "font-mono"
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  done,
  success,
  error,
  warning,
  title,
  date,
  detail,
}: {
  done?: boolean;
  success?: boolean;
  error?: boolean;
  warning?: boolean;
  title: string;
  date: Date;
  detail?: string;
}) {
  const dotClass = error
    ? "bg-red-500"
    : warning
      ? "bg-amber-500"
      : success
        ? "bg-emerald-500"
        : done
          ? "bg-indigo-500"
          : "bg-[color:var(--color-fg)]/30";

  return (
    <li className="relative pb-4 pl-6 last:pb-0">
      <span
        className={cn(
          "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--color-bg)]",
          dotClass
        )}
      />
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
        {formatDate(date)} · {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
      </div>
      {detail && (
        <div className="mt-1 text-xs text-[color:var(--color-muted)]">
          {detail}
        </div>
      )}
    </li>
  );
}

