"use client";

/**
 * Otopilot Pilot — sağ alt köşede sürekli görünen canlı AI indicator.
 *
 * - Otopilot KAPALIYKEN tamamen gizli
 * - Otopilot AÇIKKEN: pulse animasyonlu yuvarlak buton
 * - Click → expand son 5 EXECUTED aksiyon listesi
 * - Polling: her 8sn bir /api/autopilot/recent
 * - Yeni aksiyon geldiğinde: bottom-right toast (5sn)
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
  MessageSquare,
  Package,
  Receipt,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const POLL_INTERVAL_MS = 8000;
const TOAST_DURATION_MS = 5500;

type AutoPilotActionType =
  | "REVIEW_REPLY"
  | "INVOICE_ISSUE"
  | "STOCK_REORDER"
  | "BANK_MATCH"
  | "ORDER_CONFIRM";

type Item = {
  id: string;
  type: AutoPilotActionType | string;
  status: string;
  decision: string;
  reasoning: string | null;
  confidence: number | null;
  triggerSummary: string;
  resultRef: string | null;
  createdAt: string;
};

type FeedResponse = {
  enabled: boolean;
  items: Item[];
  serverTime: string;
};

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    accent: string;
  }
> = {
  REVIEW_REPLY: {
    label: "Yorum cevabı",
    icon: MessageSquare,
    color: "text-amber-500",
    accent: "from-amber-500/15 to-amber-500/5 border-amber-500/30",
  },
  INVOICE_ISSUE: {
    label: "E-fatura kesimi",
    icon: Receipt,
    color: "text-emerald-500",
    accent: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30",
  },
  STOCK_REORDER: {
    label: "Stok sipariş",
    icon: Package,
    color: "text-indigo-500",
    accent: "from-indigo-500/15 to-indigo-500/5 border-indigo-500/30",
  },
  BANK_MATCH: {
    label: "Havale eşleştirme",
    icon: Link2,
    color: "text-fuchsia-500",
    accent: "from-fuchsia-500/15 to-fuchsia-500/5 border-fuchsia-500/30",
  },
  ORDER_CONFIRM: {
    label: "Sipariş onayı",
    icon: CheckCircle2,
    color: "text-cyan-500",
    accent: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/30",
  },
};

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? {
      label: type,
      icon: Sparkles,
      color: "text-fuchsia-500",
      accent: "from-fuchsia-500/15 to-fuchsia-500/5 border-fuchsia-500/30",
    }
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "şimdi";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}dk`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}sa`;
  return d.toLocaleDateString("tr-TR");
}

function refToHref(ref: string | null): string | null {
  if (!ref) return null;
  const [type, id] = ref.split(":");
  if (type === "order") return `/admin/orders/${id}`;
  if (type === "invoice") return `/admin/invoices/${id}`;
  if (type === "review") return `/admin/reviews?productId=${id}`;
  if (type === "supplier") return `/admin/suppliers/${id}`;
  return null;
}

export function AutoPilotPilot({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Item | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function poll() {
      try {
        const r = await fetch("/api/autopilot/recent?limit=5", {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as FeedResponse;
        if (cancelled) return;

        // Enabled state senkron tut (settings'ten kapatılırsa)
        setEnabled(data.enabled);

        if (data.items.length > 0) {
          setItems(data.items);

          // Yeni bir aksiyon mu? lastIdRef ile karşılaştır
          const newest = data.items[0];
          if (
            lastIdRef.current !== null &&
            newest.id !== lastIdRef.current
          ) {
            // İlk yüklemede toast atma (sadece subsequent değişikliklerde)
            showToast(newest);
          }
          lastIdRef.current = newest.id;
        }
      } catch {
        // sessizce devam
      }
    }

    function showToast(item: Item) {
      setToast(item);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Toast — yeni AI aksiyonu */}
      {toast && (
        <div className="pointer-events-auto fixed bottom-24 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in-50 duration-300">
          <ToastCard item={toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Floating Pilot */}
      <div className="pointer-events-auto fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Expand panel */}
        {open && (
          <div className="w-80 rounded-xl border border-fuchsia-500/30 bg-[color:var(--color-bg)] shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2 fade-in-50 duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Otopilot canlı</div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">
                    {items.length > 0
                      ? `Son ${items.length} AI aksiyonu`
                      : "Henüz aksiyon yok"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-[color:var(--color-fg)]/[0.06]"
                aria-label="Kapat"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="max-h-80 divide-y divide-[color:var(--color-border)] overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-[color:var(--color-muted)]">
                  Otopilot bekliyor — bir olay tetiklendiğinde burada görünür.
                </li>
              ) : (
                items.map((item) => <FeedItem key={item.id} item={item} />)
              )}
            </ul>

            <Link
              href="/admin/autopilot"
              className="flex items-center justify-center gap-1 border-t border-[color:var(--color-border)] px-4 py-2 text-xs text-fuchsia-600 hover:bg-fuchsia-500/[0.04] dark:text-fuchsia-400"
            >
              Tüm timeline'a git <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Pulse button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105 active:scale-95"
          aria-label="Otopilot canlı feed"
          title={open ? "Kapat" : "Otopilot canlı"}
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-fuchsia-500/40 animate-ping" />
          <span className="absolute inset-0 rounded-full ring-2 ring-fuchsia-500/30" />
          <span className="relative">
            {open ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </span>
          {/* AKTİF badge */}
          <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-2 ring-[color:var(--color-bg)]">
            ●
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Feed item ──────────────────────────────────────────────────────────────

function FeedItem({ item }: { item: Item }) {
  const m = metaFor(item.type);
  const Icon = m.icon;
  const href = refToHref(item.resultRef);

  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <li>
      {/* @ts-expect-error — Link/div polymorphic */}
      <Wrapper
        {...wrapperProps}
        className={cn(
          "flex items-start gap-2 px-3 py-2.5",
          href && "hover:bg-[color:var(--color-fg)]/[0.025]",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[color:var(--color-fg)]/[0.04]",
            m.color,
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium leading-snug">{item.decision}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[color:var(--color-muted)]">
            <span>{m.label}</span>
            <span>·</span>
            <span>{formatRelative(item.createdAt)}</span>
            {item.confidence != null && (
              <>
                <span>·</span>
                <span className="font-mono tabular-nums">%{item.confidence}</span>
              </>
            )}
            {href && <ExternalLink className="ml-auto h-2.5 w-2.5 opacity-50" />}
          </div>
        </div>
      </Wrapper>
    </li>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function ToastCard({
  item,
  onClose,
}: {
  item: Item;
  onClose: () => void;
}) {
  const m = metaFor(item.type);
  const Icon = m.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur shadow-2xl",
        m.accent,
      )}
    >
      {/* Pulse effect strip */}
      <div className="absolute left-0 top-0 h-full w-1 animate-pulse bg-gradient-to-b from-fuchsia-500 to-indigo-500" />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span
          className={cn(
            "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-fuchsia-500" />
            <span className="font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
              Otopilot
            </span>
            <span className="text-[10px] text-[color:var(--color-muted)]">
              {m.label}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium leading-snug">
            {item.decision}
          </div>
          {item.confidence != null && (
            <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
              Güven: %{item.confidence}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
          aria-label="Kapat"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Auto-close progress bar */}
      <div className="h-0.5 w-full bg-[color:var(--color-fg)]/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500"
          style={{
            animation: `autopilotShrink ${TOAST_DURATION_MS}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes autopilotShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/** Unused icon imports — keep tree-shake silent */
void [Building2, Users, ChevronUp];
