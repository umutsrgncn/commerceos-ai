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

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FlaskConical,
  Link2,
  Loader2,
  MessageSquare,
  Package,
  Pause,
  Play,
  Power,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  Tag,
  UserSearch,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toggleAutoPilotAction } from "@/lib/actions/settings";
import {
  demoBankPaymentAction,
  demoConfirmOrderAction,
  demoNegativeReviewAction,
  demoNewReviewAction,
  demoPriceSuggestionAction,
  demoSegmentCustomerAction,
  demoStockDropAction,
  type DemoResult,
} from "@/lib/actions/autopilot-demo";
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
  const [tab, setTab] = useState<"feed" | "demo">("feed");
  const [toast, setToast] = useState<Item | null>(null);
  const [toggling, startToggle] = useTransition();
  const lastIdRef = useRef<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggle() {
    const next = !enabled;
    startToggle(async () => {
      const r = await toggleAutoPilotAction(next);
      if (r.ok) setEnabled(r.enabled);
    });
  }

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

  return (
    <>
      {/* Toast — yeni AI aksiyonu */}
      {toast && enabled && (
        <div className="pointer-events-auto fixed bottom-24 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in-50 duration-300">
          <ToastCard item={toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Floating Pilot */}
      <div className="pointer-events-auto fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Expand panel */}
        {open && (
          <div
            className={cn(
              "w-80 rounded-xl border bg-[color:var(--color-bg)]/95 shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2 fade-in-50 duration-200",
              enabled
                ? "border-fuchsia-500/30"
                : "border-[color:var(--color-border)]",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "relative grid h-8 w-8 place-items-center rounded-lg text-white shadow-sm",
                    enabled
                      ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500"
                      : "bg-[color:var(--color-fg)]/[0.15] text-[color:var(--color-muted)]",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    Otopilot
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        enabled
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-muted)]",
                      )}
                    >
                      {enabled ? "AKTİF" : "PASİF"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">
                    {enabled
                      ? items.length > 0
                        ? `Son ${items.length} AI aksiyonu`
                        : "AI olay bekliyor"
                      : "AI günlük operasyonu yönetmiyor"}
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

            {/* Toggle satırı */}
            <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <button
                type="button"
                onClick={toggle}
                disabled={toggling}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50",
                  enabled
                    ? "bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400"
                    : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
                )}
              >
                {toggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : enabled ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {enabled ? "Durdur" : "Başlat"}
              </button>
              <Link
                href="/admin/settings"
                className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
                title="Otopilot ayarları"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Tab navigasyon — sadece otopilot aktifken */}
            {enabled && (
              <div className="flex border-b border-[color:var(--color-border)] px-2">
                <TabButton
                  active={tab === "feed"}
                  onClick={() => setTab("feed")}
                  icon={<Sparkles className="h-3 w-3" />}
                  label="Canlı feed"
                  count={items.length}
                />
                <TabButton
                  active={tab === "demo"}
                  onClick={() => setTab("demo")}
                  icon={<FlaskConical className="h-3 w-3" />}
                  label="Demo tetikleyici"
                  highlight
                />
              </div>
            )}

            {enabled ? (
              tab === "feed" ? (
                <>
                  <ul className="max-h-72 divide-y divide-[color:var(--color-border)] themed-scroll overflow-y-auto">
                    {items.length === 0 ? (
                      <li className="px-4 py-6 text-center text-xs text-[color:var(--color-muted)]">
                        Otopilot bekliyor — bir olay tetiklendiğinde burada
                        görünür. Test etmek için <strong>Demo
                        tetikleyici</strong> sekmesine geç.
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
                </>
              ) : (
                <DemoTriggers />
              )
            ) : (
              <div className="space-y-2 px-4 py-5 text-center text-xs text-[color:var(--color-muted)]">
                <p>
                  Otopilot pasif. <strong>Başlat</strong>'a basınca AI günlük
                  operasyonu yönetmeye başlar:
                </p>
                <ul className="mx-auto inline-block space-y-0.5 text-left text-[11px] leading-relaxed">
                  <li>• Müşteri yorumlarına Türkçe cevap</li>
                  <li>• Sipariş onayında otomatik e-fatura</li>
                  <li>• Kritik stoğa tedarikçi siparişi</li>
                  <li>• Havale/EFT eşleştirme</li>
                  <li>• AI fiyat ve segmentasyon önerisi</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Floating button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "group relative grid h-12 w-12 place-items-center rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95",
            enabled
              ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-fuchsia-500/30"
              : "bg-[color:var(--color-fg)]/[0.85] shadow-black/20",
          )}
          aria-label={enabled ? "Otopilot canlı feed" : "Otopilot pasif"}
          title={enabled ? "Otopilot AKTİF" : "Otopilot pasif"}
        >
          {enabled && (
            <>
              <span className="absolute inset-0 rounded-full bg-fuchsia-500/40 animate-ping" />
              <span className="absolute inset-0 rounded-full ring-2 ring-fuchsia-500/30" />
            </>
          )}
          <span className="relative">
            {open ? (
              <ChevronDown className="h-5 w-5" />
            ) : enabled ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <Power className="h-5 w-5" />
            )}
          </span>
          {/* Status badge */}
          <span
            className={cn(
              "absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-white ring-2 ring-[color:var(--color-bg)]",
              enabled ? "bg-emerald-500" : "bg-[color:var(--color-muted)]",
            )}
          >
            {enabled ? "●" : "○"}
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Tab button ─────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition",
        active
          ? "text-[color:var(--color-fg)]"
          : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
      )}
    >
      <span
        className={cn(
          highlight && !active && "text-fuchsia-500",
          active && highlight && "text-fuchsia-600 dark:text-fuchsia-400",
        )}
      >
        {icon}
      </span>
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0 text-[9px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
          {count}
        </span>
      )}
      {active && (
        <span
          className={cn(
            "absolute -bottom-px left-2 right-2 h-0.5 rounded-full",
            highlight ? "bg-fuchsia-500" : "bg-indigo-500",
          )}
        />
      )}
    </button>
  );
}

// ─── Demo tetikleyici ───────────────────────────────────────────────────────

type DemoSim =
  | "review"
  | "negative"
  | "order"
  | "bank"
  | "stock"
  | "segment"
  | "price";

const DEMO_META: Record<
  DemoSim,
  {
    label: string;
    description: string;
    expected: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: "amber" | "red" | "emerald" | "blue" | "indigo" | "purple" | "pink";
    action: () => Promise<DemoResult>;
  }
> = {
  review: {
    label: "Pozitif yorum gelsin",
    description: "5★ demo yorum eklenir",
    expected: "→ AI markaya uygun teşekkür cevabı yazar, yayınlar",
    icon: MessageSquare,
    accent: "amber",
    action: demoNewReviewAction,
  },
  negative: {
    label: "Negatif yorum gelsin",
    description: "1-2★ olumsuz yorum eklenir",
    expected: "→ AI sentiment analiz + flag + özür cevabı",
    icon: ShieldAlert,
    accent: "red",
    action: demoNegativeReviewAction,
  },
  order: {
    label: "Sipariş onaylansın",
    description: "PENDING sipariş CONFIRMED'a alınır",
    expected: "→ AI e-fatura/e-arşiv keser, GİB'e kaydeder",
    icon: Receipt,
    accent: "emerald",
    action: demoConfirmOrderAction,
  },
  bank: {
    label: "Havale geldi",
    description: "Müşteri sipariş tutarını yatırır",
    expected: "→ AI havaleyi siparişle eşleştirir + onaylar",
    icon: Banknote,
    accent: "blue",
    action: demoBankPaymentAction,
  },
  stock: {
    label: "Stok kritiğe düşsün",
    description: "Bir ürünün stoğu 3'e indirilir",
    expected: "→ AI tedarikçiye Türkçe sipariş maili yazar",
    icon: Package,
    accent: "indigo",
    action: demoStockDropAction,
  },
  segment: {
    label: "VIP segmentleme",
    description: "Bir müşteri AI ile segmentlenir",
    expected: "→ AI segment + aksiyon önerisi (loyalty/risky/VIP)",
    icon: UserSearch,
    accent: "purple",
    action: demoSegmentCustomerAction,
  },
  price: {
    label: "Fiyat önerisi",
    description: "Yavaş hareket eden ürün taranır",
    expected: "→ AI rekabet bazlı yeni fiyat + gerekçe yazar",
    icon: Tag,
    accent: "pink",
    action: demoPriceSuggestionAction,
  },
};

const ALL_SIMS: DemoSim[] = [
  "review",
  "negative",
  "order",
  "bank",
  "stock",
  "segment",
  "price",
];

const ACCENT_CLASS: Record<string, string> = {
  amber: "text-amber-600 bg-amber-500/10 group-hover:bg-amber-500/15",
  red: "text-red-600 bg-red-500/10 group-hover:bg-red-500/15",
  emerald: "text-emerald-600 bg-emerald-500/10 group-hover:bg-emerald-500/15",
  blue: "text-blue-600 bg-blue-500/10 group-hover:bg-blue-500/15",
  indigo: "text-indigo-600 bg-indigo-500/10 group-hover:bg-indigo-500/15",
  purple: "text-purple-600 bg-purple-500/10 group-hover:bg-purple-500/15",
  pink: "text-pink-600 bg-pink-500/10 group-hover:bg-pink-500/15",
};

const AUTO_INTERVAL_MS = 15000; // 15sn aralıklarla rastgele demo
const AUTO_KEY = "commerceos:autopilot-demo-auto-v1";

function DemoTriggers() {
  const [pending, start] = useTransition();
  const [activeSim, setActiveSim] = useState<DemoSim | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    sim: DemoSim;
    message: string;
  } | null>(null);

  // Auto mode
  const [autoMode, setAutoMode] = useState(false);
  const [countdown, setCountdown] = useState<number>(AUTO_INTERVAL_MS / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSimsRef = useRef<DemoSim[]>([]);

  // İlk mount'ta auto state'i yükle (sayfa değişiminde devam etsin)
  useEffect(() => {
    try {
      const v = localStorage.getItem(AUTO_KEY);
      if (v === "1") setAutoMode(true);
    } catch {}
  }, []);

  function persistAuto(v: boolean) {
    try {
      localStorage.setItem(AUTO_KEY, v ? "1" : "0");
    } catch {}
  }

  function pickRandomSim(): DemoSim {
    // Son 2 demoyu tekrar etmemeye çalış
    const recent = new Set(lastSimsRef.current);
    const candidates = ALL_SIMS.filter((s) => !recent.has(s));
    const pool = candidates.length > 0 ? candidates : ALL_SIMS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function runSim(sim: DemoSim) {
    if (pending) return;
    setActiveSim(sim);
    setFeedback(null);
    lastSimsRef.current = [sim, ...lastSimsRef.current].slice(0, 2);
    start(async () => {
      const r = await DEMO_META[sim].action();
      setFeedback(
        r.ok
          ? { ok: true, sim, message: r.message }
          : { ok: false, sim, message: r.error },
      );
      setActiveSim(null);
    });
  }

  // Auto mode interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (!autoMode) {
      setCountdown(AUTO_INTERVAL_MS / 1000);
      return;
    }
    setCountdown(AUTO_INTERVAL_MS / 1000);
    // Hemen ilk demoyu çalıştır
    runSim(pickRandomSim());
    intervalRef.current = setInterval(() => {
      runSim(pickRandomSim());
      setCountdown(AUTO_INTERVAL_MS / 1000);
    }, AUTO_INTERVAL_MS);
    tickRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  function toggleAuto() {
    setAutoMode((v) => {
      const next = !v;
      persistAuto(next);
      return next;
    });
  }

  return (
    <div className="space-y-2 px-3 py-3 max-h-[60vh] themed-scroll overflow-y-auto">
      {/* Otomatik mod kontrolü */}
      <button
        type="button"
        onClick={toggleAuto}
        className={cn(
          "group relative w-full overflow-hidden rounded-lg border p-2.5 text-left transition",
          autoMode
            ? "border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500/[0.08] to-indigo-500/[0.06]"
            : "border-[color:var(--color-border)] bg-[color:var(--color-bg)] hover:border-fuchsia-500/30",
        )}
      >
        {/* Progress bar — otomatik moddayken sıradaki tetiğe sayım */}
        {autoMode && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all"
            style={{
              width: `${((AUTO_INTERVAL_MS / 1000 - countdown) / (AUTO_INTERVAL_MS / 1000)) * 100}%`,
            }}
          />
        )}
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition",
              autoMode
                ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white animate-pulse"
                : "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
            )}
          >
            {autoMode ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold">
                Otomatik demo modu
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  autoMode
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
                )}
              >
                {autoMode ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <p className="text-[10px] text-[color:var(--color-muted)]">
              {autoMode
                ? `${countdown}sn sonra rastgele bir demo tetiklenecek`
                : `Her 15sn'de bir rastgele demo otomatik çalıştırır`}
            </p>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1.5 rounded-md border border-fuchsia-500/15 bg-gradient-to-r from-fuchsia-500/[0.04] to-indigo-500/[0.03] px-2.5 py-1.5 text-[10px] text-fuchsia-700 dark:text-fuchsia-400">
        <Zap className="h-3 w-3 shrink-0" />
        <span>
          Olayı manuel tetikle veya <strong>otomatik mod</strong> ile sürekli
          çalıştır.
        </span>
      </div>

      {ALL_SIMS.map((sim) => {
        const meta = DEMO_META[sim];
        const Icon = meta.icon;
        const busy = activeSim === sim && pending;
        return (
          <button
            key={sim}
            type="button"
            onClick={() => runSim(sim)}
            disabled={pending}
            className={cn(
              "group flex w-full items-start gap-2.5 rounded-lg border bg-[color:var(--color-bg)] p-2.5 text-left transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.03] disabled:cursor-not-allowed disabled:opacity-50",
              busy
                ? "border-fuchsia-500/40 bg-fuchsia-500/[0.04]"
                : "border-[color:var(--color-border)]",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition",
                ACCENT_CLASS[meta.accent],
              )}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium leading-tight">
                {meta.label}
              </div>
              <p className="mt-0.5 text-[10px] text-[color:var(--color-muted)] leading-tight">
                {meta.description}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-fuchsia-600 dark:text-fuchsia-400 leading-tight">
                {meta.expected}
              </p>
            </div>
          </button>
        );
      })}

      {feedback && (
        <div
          className={cn(
            "flex items-start gap-1.5 rounded-md border p-2 text-[11px]",
            feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/[0.06] text-red-600",
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
          )}
          <span className="leading-snug">
            <strong>{DEMO_META[feedback.sim].label}:</strong> {feedback.message}
          </span>
        </div>
      )}
    </div>
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
