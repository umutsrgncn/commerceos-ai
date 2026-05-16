"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  Star,
  TrendingUp,
  Receipt,
  Building,
  BarChart3,
  Activity,
} from "lucide-react";
import Image from "next/image";

import { CommerceOSLogo } from "@/components/brand/logo";
import { FakeCursor } from "./FakeCursor";
import { SceneAIDeveloper } from "./scenes/AIDeveloper";
import { SceneOtopilot } from "./scenes/Otopilot";
import { SceneAsistan } from "./scenes/Asistan";

type SceneId = "ai-dev" | "otopilot" | "asistan";

/**
 * Gerçek admin sidebar replikası. Cursor sadece AI grup'unda 3 item'a tıklar.
 */
const NAV_GROUPS: Array<{
  label?: string;
  items: Array<{ label: string; icon: typeof Sparkles; sceneId?: SceneId }>;
}> = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Ürünler", icon: Package },
      { label: "Kategoriler", icon: FolderTree },
      { label: "Envanter", icon: Boxes },
      { label: "Siparişler", icon: ShoppingCart },
      { label: "Müşteriler", icon: Users },
      { label: "Yorumlar", icon: Star },
    ],
  },
  {
    label: "Finans",
    items: [
      { label: "Finans", icon: TrendingUp },
      { label: "E-Fatura", icon: Receipt },
      { label: "Banka", icon: Building },
      { label: "Analitik", icon: BarChart3 },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "AI Asistan", icon: MessageSquare, sceneId: "asistan" },
      { label: "Otopilot", icon: Sparkles, sceneId: "otopilot" },
      { label: "AI Geliştirici", icon: Bot, sceneId: "ai-dev" },
    ],
  },
  {
    label: "Sistem",
    items: [{ label: "Etkinlik", icon: Activity }],
  },
];

// Sahne başına dwell (içindeki animasyonun bitmesi için)
// Sahne içindeki gerçek play() süresine birebir uyumlu — bittikten sonra ek
// "boş bekleme" olmasın diye sahneyi yarıda kesmeden bitirmeli.
const SCENE_DWELL: Record<SceneId, number> = {
  "ai-dev": 14500, // list 3.5 + submitting 1 + detail 5 + preview 4 + merged 1 = 14.5
  otopilot: 11500, // 7 trigger × ~1.35 + initial 0.6 + buffer 1.4 = 11.5
  asistan: 16000, // 3 soru × ~5.05 (type ~1.4 + 0.35 + 0.28 + 0.45 + 0.7 + 0.9 + 1.2) + 0.4 init
};

const SCENE_ORDER: SceneId[] = ["ai-dev", "otopilot", "asistan"];

export function HeroDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState<SceneId>("ai-dev");
  const [clicking, setClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);

  const cursorControls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Cursor parent = grid div (sidebar + main). Cursor absolute left/top buna göre.
  // itemRefs ile koordinat hesaplaması bu div'in rect'ine göre yapılmalı,
  // YOKSA outer div + BrowserChrome yüksekliği farkı kayma yaratır.
  const cursorParentRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(true);
  const itemRefs = useRef<Record<SceneId, HTMLDivElement | null>>({
    "ai-dev": null,
    otopilot: null,
    asistan: null,
  });

  /**
   * Cursor SVG'nin TIP noktası (path başlangıcı koord: 4, 2.5).
   * Cursor div'in left/top'ı bu offset kadar geriye alınmalı ki
   * görsel TIP noktası item üstüne tam otursun.
   * Hesap cursor parent (grid div) rect'ine göre.
   */
  const targetForScene = useCallback(
    (scene: SceneId): { x: number; y: number } => {
      const parent = cursorParentRef.current;
      const item = itemRefs.current[scene];
      if (!parent || !item) return { x: 24, y: 100 };
      const pRect = parent.getBoundingClientRect();
      const iRect = item.getBoundingClientRect();
      const CURSOR_TIP_X = 4;
      const CURSOR_TIP_Y = 2.5;
      // Tip noktası item içinde ~16px sağda (icon merkezi), dikey ortada
      return {
        x: iRect.left - pRect.left + 16 - CURSOR_TIP_X,
        y: iRect.top - pRect.top + iRect.height / 2 - CURSOR_TIP_Y,
      };
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;
    runningRef.current = true;

    async function playScene(scene: SceneId) {
      if (!runningRef.current || !isVisible) return;
      const target = targetForScene(scene);
      await cursorControls.start({
        x: target.x,
        y: target.y,
        transition: { type: "spring", stiffness: 90, damping: 20, mass: 0.85 },
      });
      if (!runningRef.current || !isVisible) return;
      // Click pulse ile sahne değişimi paralel olsun — kullanıcı "bekleme" hissetmesin
      setClicking(true);
      setActive(scene);
      setSceneKey((k) => k + 1);
      await new Promise((r) => setTimeout(r, 480)); // pulse animation süresi
      setClicking(false);
      await new Promise((r) => setTimeout(r, SCENE_DWELL[scene]));
    }

    (async () => {
      // İlk render'da hedef hesaplanmış olsun diye küçük bekleme
      await new Promise((r) => setTimeout(r, 100));
      const initial = targetForScene("ai-dev");
      cursorControls.set({ x: initial.x, y: initial.y });

      while (runningRef.current) {
        if (!isVisible) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        for (const s of SCENE_ORDER) {
          if (!runningRef.current) break;
          await playScene(s);
        }
      }
    })();

    return () => {
      runningRef.current = false;
    };
  }, [cursorControls, isVisible, prefersReducedMotion, isMobile, targetForScene]);

  if (isMobile || prefersReducedMotion) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
        <BrowserChrome />
        <div className="relative aspect-[16/10]">
          <Image
            src="/team/shot-dashboard-dark.jpg"
            alt="CommerceOS Dashboard"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            priority
            className="object-cover object-top"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl"
    >
      <BrowserChrome />
      <div
        ref={cursorParentRef}
        className="relative grid aspect-[16/10] grid-cols-[170px_1fr] bg-[#09090b]"
      >
        {/* Sidebar — gerçek admin replikası */}
        <aside className="overflow-hidden border-r border-white/[0.05] bg-black/40 py-1.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold tracking-tight text-white/90">
            <CommerceOSLogo size={18} className="shrink-0" />
            CommerceOS
          </div>
          <nav className="px-1.5">
            {NAV_GROUPS.map((g, gi) => (
              <div key={gi} className="mt-1.5 first:mt-0">
                {g.label && (
                  <div className="px-2 pb-0.5 pt-1 text-[7px] font-semibold uppercase tracking-wider text-white/30">
                    {g.label}
                  </div>
                )}
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = it.sceneId === active;
                  return (
                    <div
                      key={it.label}
                      ref={(el) => {
                        if (it.sceneId) itemRefs.current[it.sceneId] = el;
                      }}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[9px] transition-colors ${
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-white/45"
                      }`}
                    >
                      <Icon
                        className={`h-2.5 w-2.5 ${
                          isActive ? "text-fuchsia-300" : "text-white/40"
                        }`}
                      />
                      <span className="truncate">{it.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Sahne alanı — popLayout: exit/enter paralel, "boş bekleme" yok */}
        <main className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {active === "ai-dev" && <SceneAIDeveloper key={`ai-dev-${sceneKey}`} />}
            {active === "otopilot" && <SceneOtopilot key={`otopilot-${sceneKey}`} />}
            {active === "asistan" && <SceneAsistan key={`asistan-${sceneKey}`} />}
          </AnimatePresence>
        </main>

        <FakeCursor controls={cursorControls} initial={{ x: 24, y: 200 }} clicking={clicking} />
      </div>

      <NoiseOverlay />
    </div>
  );
}

function BrowserChrome() {
  return (
    <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
      <span className="ml-3 text-[10px] font-mono text-white/40">
        commerceos.cloud/admin
      </span>
    </div>
  );
}

function NoiseOverlay() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.03]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence baseFrequency='0.85'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}
