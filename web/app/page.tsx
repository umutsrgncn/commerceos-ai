import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  Github,
  Mail,
  MessageSquare,
  Package,
  Play,
  Receipt,
  RefreshCw,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import {
  OtopilotCard,
  OtopilotHeroBanner,
  OtopilotLiveFeed,
  OtopilotShowcase,
  PulseBadge,
} from "@/components/landing/otopilot-feed";
import {
  HeroBgOrbs,
  SmoothScroll,
} from "@/components/landing/landing-effects";
import { MacbookScroll } from "@/components/aceternity/macbook-scroll";
import { Spotlight } from "@/components/aceternity/spotlight";
import { TextGenerateEffect } from "@/components/aceternity/text-generate";
import { MovingBorderButton } from "@/components/aceternity/moving-border";

export const metadata = {
  title: "CommerceOS — AI-destekli e-ticaret yönetim paneli",
  description:
    "Otopilot 7 farklı işi yönetir: yorum cevabı, e-fatura, stok sipariş, havale eşleştirme, fiyat, segmentasyon, anomali. Gemini AI + Türkiye'ye özel (KVKK, GİB, iyzico).",
};

const STATS = [
  { value: "15+", label: "AI noktası", accent: "from-fuchsia-400 to-pink-400" },
  { value: "7", label: "Otopilot kabiliyeti", accent: "from-indigo-400 to-cyan-400" },
  { value: "20+", label: "Entegre modül", accent: "from-emerald-400 to-teal-400" },
  { value: "Türkçe", label: "AI çıktıları", accent: "from-amber-400 to-orange-400" },
];

const MODULES = [
  { icon: ShoppingCart, title: "Sipariş", desc: "Stok rezervasyonu, kargo, durum geçişleri" },
  { icon: Package, title: "Ürün & envanter", desc: "AI açıklama + görsel, otomatik stok" },
  { icon: Users, title: "Müşteri", desc: "Sadık / VIP / risky AI segmentasyon" },
  { icon: Receipt, title: "GİB e-fatura", desc: "E-fatura + e-arşiv, otopilot otomatik" },
  { icon: CreditCard, title: "iyzico", desc: "Sandbox + üretim, 3DS callback" },
  { icon: TrendingUp, title: "Finans", desc: "Kâr/zarar, 30g AI tahmin, anomali" },
  { icon: Banknote, title: "Banka", desc: "EFT/havale CSV import, AI eşleştirme" },
  { icon: Bot, title: "Otopilot", desc: "Yorum, fatura, stok, havale — AI" },
];

const TEAM = [
  {
    name: "Umut Sargıncan",
    title: "Full-stack & AI",
    handle: "umutsrgncn",
    avatar: "/team/umut.jpg",
    color: "fuchsia",
  },
  {
    name: "Çiğdem Kılıç",
    title: "Full-stack & UI",
    handle: "cigdemkilic",
    avatar: "/team/cigdem.jpg",
    color: "indigo",
  },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        body { overflow-x: hidden; scrollbar-width: none; background: #000; }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <SmoothScroll />

      <main className="relative min-h-screen bg-black text-white selection:bg-fuchsia-500/40">
        {/* ─── Top nav ─── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <CommerceOSLogo size={36} />
              <span className="text-base font-semibold tracking-tight">
                CommerceOS
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
              <a href="#ai" className="hover:text-white transition">AI</a>
              <a href="#modules" className="hover:text-white transition">Modüller</a>
              <a href="#team" className="hover:text-white transition">Ekip</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="https://github.com/umutsrgncn/commerceos-ai"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:text-white sm:inline-flex"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                >
                  Giriş yap
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden">
          {/* Aceternity Spotlight — premium beam efekti */}
          <Spotlight />
          {/* Animated floating orbs */}
          <HeroBgOrbs />
          {/* Grid + bottom fade */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#000_100%)]" />
            <GridPattern />
          </div>

          <div className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28">
            <Link
              href="https://github.com/umutsrgncn/commerceos-ai"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs backdrop-blur-xl transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.08]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              </span>
              Hackathon projesi · fatal exception team
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
            </Link>

            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
              E-ticaretin{" "}
              <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                AI yönettiği
              </span>
              <br />
              admin paneli
            </h1>

            <TextGenerateEffect
              words="Otopilot 7 farklı işi paralel yönetir — yorum cevabı, e-fatura, stok, havale, fiyat, segment, anomali. Sen sadece onaylarsın."
              className="mx-auto mt-6 max-w-2xl text-pretty text-base font-normal !text-white/70 sm:text-lg"
              duration={0.4}
            />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <MovingBorderButton
                  duration={3500}
                  borderRadius="9999px"
                  containerClassName="h-12 w-[200px]"
                  className="bg-slate-950/80 hover:bg-slate-900/80"
                >
                  Demo panele git
                  <ArrowRight className="h-4 w-4" />
                </MovingBorderButton>
              </Link>
              <Link href="/watch" target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  1 dakikada tanıtım
                </Button>
              </Link>
              <a href="#ai">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  AI'ı canlı gör
                </Button>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-white/40">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Kayıt yok
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Kredi kartı yok
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Demo data hazır
              </span>
            </div>

            {/* Dashboard preview */}
            <div className="relative mx-auto mt-16 max-w-5xl">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-emerald-500/20 opacity-60 blur-2xl" />
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-[10px] font-mono text-white/40">
                    commerceos.app/admin
                  </span>
                </div>
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/team/shot-dashboard.jpg"
                    alt="CommerceOS Dashboard"
                    fill
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    priority
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Tech yığını — bento grid ─── */}
        <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent py-14">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs uppercase tracking-wider text-white/40">
              Üzerine inşa edildi
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <TechCell
                title="Next.js 15"
                desc="App Router · RSC · server actions"
                accent="from-white/15 to-white/[0.02]"
                logo={
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/>
                  </svg>
                }
              />
              <TechCell
                title="Gemini AI"
                desc="Streaming · vision · tool use"
                accent="from-fuchsia-500/20 to-indigo-500/10"
                logo={
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                    <path
                      d="M12 0 C12 6.627 17.373 12 24 12 C17.373 12 12 17.373 12 24 C12 17.373 6.627 12 0 12 C6.627 12 12 6.627 12 0 Z"
                      fill="url(#g-gem)"
                    />
                    <defs>
                      <linearGradient id="g-gem" x1="0" y1="0" x2="24" y2="24">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                }
              />
              <TechCell
                title="PostgreSQL"
                desc="Prisma ORM · migrations · types"
                accent="from-blue-500/20 to-cyan-500/10"
                logo={
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M5.214 11.346c0 .85.69 1.54 1.54 1.54h.027c.85 0 1.54-.69 1.54-1.54v-1.04c0-.85-.69-1.54-1.54-1.54H6.755c-.851 0-1.541.69-1.541 1.54v1.04zM12 23.43c-3.66 0-6.787-2.246-8.094-5.434a12.93 12.93 0 0 1-.835-4.706c0-3.49 1.371-6.65 3.601-8.984A12.357 12.357 0 0 1 12 .57c6.557 0 11.876 5.32 11.876 11.876S18.557 23.43 12 23.43"/>
                  </svg>
                }
                fg="text-blue-300"
              />
              <TechCell
                title="iyzico"
                desc="3DS · sandbox + üretim · Türkiye"
                accent="from-rose-500/15 to-pink-500/10"
                logo={
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-rose-500 to-pink-500 text-[9px] font-bold text-white">
                    iyz
                  </div>
                }
              />
              <TechCell
                title="GİB E-Fatura"
                desc="Entegratör · e-arşiv · UBL XML"
                accent="from-emerald-500/15 to-teal-500/10"
                logo={
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 text-[9px] font-bold text-white">
                    GİB
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* ─── Stats ─── */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6"
              >
                <div
                  className={`bg-gradient-to-br ${s.accent} bg-clip-text text-3xl font-semibold tabular-nums text-transparent sm:text-4xl`}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-white/55">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Otopilot — animated hero banner ─── */}
        <section id="ai" className="relative mx-auto max-w-6xl px-6 py-20">
          {/* Hero banner with status badge + capability chips */}
          <OtopilotHeroBanner />

          {/* Live feed + intro side-by-side */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
            <PipelineCard />
            <OtopilotLiveFeed />
          </div>

          {/* 7 detailed scenario cards — animated stagger */}
          <div className="mt-12 mb-8 text-center">
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Otopilot{" "}
              <span className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                gerçek örnekler
              </span>
            </h3>
            <p className="mt-2 text-sm text-white/55">
              Slogan değil — AI'nın girdi/çıktısını birebir göster.
            </p>
          </div>

          <OtopilotShowcase>
            {/* 1. Yorum cevabı */}
            <OtopilotCard>
              <AICase
              icon={MessageSquare}
              color="amber"
              title="Müşteri yorumuna AI cevabı"
              subtitle="Gemini 2.0 · marka diliyle"
              flow={[
                {
                  side: "in",
                  author: "Aslı Çelik · ★★★",
                  text: "Beden tablonuza güvenip aldım ama biraz büyük geldi. İade için süreç nasıl ilerliyor?",
                },
                {
                  side: "out",
                  author: "Otopilot · AI cevap",
                  text: "Aslı Hanım, geri bildirim için teşekkürler. Sipariş sayfanızdan 'İade talebi' bağlantısı ile 30 gün içinde ücretsiz değişim başlatabilirsiniz. Beden tablomuzu güncelliyoruz — yardımınız değerli.",
                },
              ]}
              meta="Cevap 14 saniyede yazıldı · Güven %92"
            />
            </OtopilotCard>

            {/* 2. E-fatura */}
            <OtopilotCard>
              <AICase
              icon={Receipt}
              color="emerald"
              title="Sipariş onayında e-fatura"
              subtitle="GİB entegratör · otomatik"
              variant="stack"
              cards={[
                {
                  label: "TETİK",
                  title: "ORD-202605-00448",
                  body: "Sipariş CONFIRMED'a alındı · ₺2.495,70",
                  tone: "neutral",
                },
                {
                  label: "AI AKSIYON",
                  title: "E-fatura kesildi",
                  body: "EAR2026000448 · GİB onaylandı · 12sn",
                  tone: "success",
                },
              ]}
              meta="Bütçe etkisi yok · Otopilot autoIssueInvoices ON"
            />
            </OtopilotCard>

            {/* 3. Stok */}
            <OtopilotCard>
              <AICase
              icon={Package}
              color="indigo"
              title="Kritik stokta tedarikçi maili"
              subtitle="AI Türkçe mail yazımı"
              variant="mail"
              mail={{
                to: "siparis@tekstilcim.com.tr",
                subject: "Yeniden Sipariş — Eşofman Altı Gri (PT-ESOFMAN-ALTI-GRI-193)",
                body: "Merhaba Tekstilcim ekibi,\n\nElimizdeki stok 3 adede düştü. 50 adet PT-ESOFMAN-ALTI-GRI-193 için yeniden sipariş açmak istiyoruz. Daha önceki teslimat süreniz 5 iş günüydü, aynı şartlarla devam etmek istiyoruz.\n\nTeyit ederseniz proforma fatura gönderebilir misiniz?\n\nİyi çalışmalar.\nCommerceOS Otopilot",
              }}
              meta="50 adet · ~₺27.500 · 5 iş günü"
            />
            </OtopilotCard>

            {/* 4. Havale eşleştirme */}
            <OtopilotCard>
              <AICase
              icon={Banknote}
              color="blue"
              title="Banka havalesinde sipariş eşleştirme"
              subtitle="AI semantik match"
              variant="match"
              match={{
                bank: {
                  amount: "₺2.116,92",
                  desc: "DEFNE ERDOGAN HAVALE — ORD-202605-00458",
                  date: "10/05",
                },
                order: {
                  number: "ORD-202605-00458",
                  customer: "Defne Erdoğan",
                  total: "₺2.116,92",
                },
                confidence: 97,
              }}
              meta="Eşleştirme + sipariş onayı + e-fatura — 3 aksiyon zincirde"
            />
            </OtopilotCard>

            {/* 5. Segmentasyon */}
            <OtopilotCard>
              <AICase
              icon={UserCircle}
              color="purple"
              title="Müşteri segmentasyonu"
              subtitle="13 sipariş / 7 günde"
              variant="segment"
              segment={{
                customer: "Ada Yıldız · ada@example.com",
                stats: [
                  { l: "Sipariş", v: "13" },
                  { l: "Toplam", v: "26.168,86 ₺" },
                  { l: "Ortalama", v: "2.012,99 ₺" },
                ],
                label: "VIP",
                reasoning:
                  "Son 7 günde 13 sipariş + 26.168,86 ₺ harcama + 2.012,99 ₺ ortalama sepet → yüksek değer.",
                action:
                  "Hoş geldin VIP indirimi + yeni ürünlere erken erişim önerildi.",
              }}
              meta="Sipariş geçmişi → AI segment + Türkçe gerekçe + aksiyon"
            />
            </OtopilotCard>

            {/* 6. Fiyat önerisi */}
            <OtopilotCard>
              <AICase
              icon={Tag}
              color="pink"
              title="Yavaş ürüne fiyat önerisi"
              subtitle="Maliyet + rekabet → yeni fiyat"
              variant="price"
              price={{
                product: "Bisiklet Yaka Tişört · BS-TS-001",
                current: "₺249,90",
                suggested: "₺199,00",
                delta: "-%20",
                reasoning:
                  "90 gün satışsız + 4 rakipte ortalama ₺189-₺215 + stokta 47 adet. -%20 indirim önerisi kâr marjını koruyor.",
              }}
              meta="Otopilot autoSuggestPrice ON · admin onayı bekler"
            />
            </OtopilotCard>

            {/* 7. Anomali */}
            <OtopilotCard>
              <AICase
              icon={AlertTriangle}
              color="red"
              title="Proaktif anomali tespiti"
              subtitle="Son 7 gün vs önceki 4 hafta"
              variant="anomaly"
              anomaly={{
                metric: "İade oranı",
                title: "Aniden artan iade",
                current: "%14",
                baseline: "%5.2",
                changePct: 169,
                severity: "high",
                explanation:
                  "Son 7 günde iade oranı %5.2'den %14'e fırladı. 'Tekstil — bahar koleksiyonu' kategorisinde yoğunlaşıyor.",
                action:
                  "Ürün açıklamalarında beden tablosu uyarısı ekle, müşteri hizmetleri ekibini bilgilendir.",
              }}
              meta="1 saat cache · admin dashboard'una düşer"
              full
            />
            </OtopilotCard>
          </OtopilotShowcase>
        </section>

        {/* ─── Macbook Scroll — Otopilot screenshot büyük ekranda ─── */}
        <section className="relative overflow-hidden bg-black">
          <MacbookScroll
            src="/team/shot-autopilot.jpg"
            showGradient
            title={
              <span className="text-white">
                Otopilot panelini{" "}
                <span className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  daha yakından
                </span>{" "}
                inceleyelim
              </span>
            }
          />
        </section>

        {/* ─── AI Asistan & Araçlar — Bölüm 2/2 ─── */}
        <section
          id="ai-tools"
          className="relative mx-auto max-w-6xl px-6 pb-20"
        >
          <div className="mb-14 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <Bot className="h-3 w-3" />
              AI Asistan & Araçlar · Bölüm 2/2
            </span>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              AI{" "}
              <span className="bg-gradient-to-br from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                her menüde
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
              Veritabanıyla konuşabilen asistan, fiş OCR'ı, ürün açıklama/görsel
              üretimi, kampanya yazımı, sentiment analizi — sayfanın istediğin
              yerinde AI tek tık uzaklıkta.
            </p>
          </div>

          {/* DB chat — full-width hero tool */}
          <DbChatShowcase />

          {/* Daha küçük AI araçları */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AIToolCard
              icon={ScanLine}
              color="emerald"
              title="Fiş OCR → otomatik gider"
              subtitle="Foto çek, AI giderini doldur"
              left={
                <div className="relative h-full min-h-[120px] overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent">
                  <Image
                    src="/ai-tools/receipt.jpg"
                    alt="Türk market fişi"
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/80">
                    <span>fis.jpg</span>
                    <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] text-emerald-200">
                      Vision
                    </span>
                  </div>
                </div>
              }
              right={
                <div className="space-y-1.5 text-xs">
                  <Row k="Satıcı" v="BIM Mağazaları A.Ş." />
                  <Row k="Tarih" v="08.05.2026" />
                  <Row k="Tutar" v="₺247,80" />
                  <Row k="KDV" v="₺37,80" />
                  <Row k="Kategori" v="Ofis · Otomatik" />
                </div>
              }
              meta="Fişten 5 alan · 6 sn · expense kaydı oluştur"
            />

            <AIToolCard
              icon={Package}
              color="fuchsia"
              title="Ürün açıklaması yazımı"
              subtitle="Başlık + öneriler → SEO copy"
              left={
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Girdi
                  </div>
                  <div className="mt-1 font-mono text-xs text-white/85">
                    Pamuk basic tişört · beyaz · M
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {["nefes", "yumuşak", "günlük"].map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              }
              right={
                <p className="text-xs leading-relaxed text-white/80">
                  Hafif dokulu %100 pamuktan üretilen bu basic beyaz tişört,
                  günlük kullanımda nefes alma rahatlığı sunar. Klasik kalıbı ve
                  yumuşak içeriği sayesinde tek başına veya katman olarak şık
                  görünüm sağlar.
                </p>
              }
              meta="Gemini stream · 8sn · markdown bold/italic ile"
            />

            <AIToolCard
              icon={Sparkles}
              color="pink"
              title="Ürün görseli üretimi"
              subtitle="Prompt → fotoğraf stüdyosu"
              left={
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Prompt
                  </div>
                  <p className="mt-1 text-xs text-white/85">
                    Beyaz tişört, stüdyo aydınlatması, neutral arka plan,
                    e-ticaret düz çekim.
                  </p>
                </div>
              }
              right={
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { pos: "0% 50%", label: "Stüdyo" },
                    { pos: "50% 50%", label: "Askıda" },
                    { pos: "100% 50%", label: "Düz" },
                  ].map((v, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]"
                    >
                      <div
                        className="absolute inset-0 bg-cover"
                        style={{
                          backgroundImage: "url(/ai-tools/tshirts.jpg)",
                          backgroundPosition: v.pos,
                          backgroundSize: "300% 100%",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-center text-[8px] font-medium uppercase tracking-wider text-white/80">
                        v{i + 1} · {v.label}
                      </div>
                    </div>
                  ))}
                </div>
              }
              meta="Higgsfield + Gemini · 3 stil varyant"
            />

            <AIToolCard
              icon={Mail}
              color="amber"
              title="Kampanya yazımı"
              subtitle="Segment + ton → e-posta"
              left={
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Hedef
                  </div>
                  <div className="text-xs">
                    <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      VIP
                    </span>
                    <span className="ml-1.5 text-white/55">
                      · 142 müşteri
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40">Ton: sıcak</div>
                </div>
              }
              right={
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-300">
                    <Mail className="h-3 w-3" />
                    Sizi özel hissetmenizi istiyoruz
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    Sevgili Ada, geçtiğimiz aylarda bizi seçtiğiniz için
                    teşekkür ederiz. VIP misafirlerimize özel hazırladığımız
                    yeni koleksiyonu ilk siz görmelisiniz...
                  </p>
                </div>
              }
              meta="142 müşteri · kişiselleştirilmiş · 1 dakikada"
            />

            <AIToolCard
              icon={MessageSquare}
              color="indigo"
              title="Sipariş mesajı önerisi"
              subtitle="Sipariş bağlamı → cevap taslağı"
              left={
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Sipariş
                  </div>
                  <div className="mt-1 font-mono text-xs">
                    ORD-202605-00461
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/55">
                    Ozan Yıldırım · ₺1.765,28 · Kargoda
                  </div>
                </div>
              }
              right={
                <div className="space-y-1.5">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-xs text-white/85">
                    Merhaba Ozan Bey, siparişiniz Aras Kargo'ya teslim
                    edildi. Takip no: 7654-321 ile ilerleyebilirsiniz...
                  </div>
                  <div className="flex gap-1">
                    <button className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                      Gönder
                    </button>
                    <button className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/60">
                      Yeniden yaz
                    </button>
                  </div>
                </div>
              }
              meta="WhatsApp / SMS / e-posta — 3 ton seçeneği"
            />

            <AIToolCard
              icon={BarChart3}
              color="cyan"
              title="Satış içgörüleri"
              subtitle="Dönem stats → AI bullet madde"
              left={
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-1 text-[10px] font-mono">
                  <div className="text-white/40">Son 30 gün</div>
                  <div>siparis: 178</div>
                  <div>ciro: 354.812 TRY</div>
                  <div>iade: 12 (%6.7)</div>
                  <div>ort.sepet: 1992</div>
                </div>
              }
              right={
                <ul className="space-y-1.5 text-xs text-white/80">
                  <li className="flex gap-1.5">
                    <span className="text-cyan-400">•</span>
                    Eşofman kategorisi ciroyu %38 sürüklüyor — stok takibi sıkı
                    olsun.
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-cyan-400">•</span>
                    Hafta sonu ciro hafta içine göre %22 yüksek — kampanya
                    pencerelerini taşı.
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-cyan-400">•</span>
                    İade oranı normalin üstünde — beden tablosu güncellenmeli.
                  </li>
                </ul>
              }
              meta="Streaming · 3-5 madde · gerçek sayılar"
            />

            <AIToolCard
              icon={Star}
              color="rose"
              title="Yorum sentiment & flag"
              subtitle="AI sentiment + risk skoru"
              left={
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <Star className="h-3 w-3" />
                    Aslı Çelik · ★★ · 14 dk önce
                  </div>
                  <p className="mt-1 text-white/85">
                    Berbat kalite, parasını hak etmiyor. Asla almayın.
                  </p>
                </div>
              }
              right={
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
                      Negatif
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      Flag
                    </span>
                    <span className="font-mono text-[10px] text-white/40">
                      güven %94
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2 text-xs text-white/80">
                    AI özür cevabı taslağı + iade workflow'u tetiklendi.
                  </div>
                </div>
              }
              meta="Otopilot autoAnalyzeReviews · canlı tetik"
            />

            <AIToolCard
              icon={Tag}
              color="violet"
              title="Yavaş ürünlere fiyat taraması"
              subtitle="Toplu AI fiyat önerisi"
              left={
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1 text-[10px] font-mono">
                  <div className="text-white/40">Yavaş hareket eden</div>
                  <div>BS-TS-001 · 90 gün</div>
                  <div>PT-BLK-XL · 75 gün</div>
                  <div>SW-GRY-M · 92 gün</div>
                  <div className="text-white/30">+ 12 ürün daha</div>
                </div>
              }
              right={
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-2">
                    <span className="font-mono">BS-TS-001</span>
                    <span className="font-mono text-violet-300">-%20</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-2">
                    <span className="font-mono">PT-BLK-XL</span>
                    <span className="font-mono text-violet-300">-%15</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-2">
                    <span className="font-mono">SW-GRY-M</span>
                    <span className="font-mono text-violet-300">-%25</span>
                  </div>
                </div>
              }
              meta="Tek tıkla tüm yavaş ürünleri AI taratır"
            />
          </div>
        </section>

        {/* ─── Modules grid ─── */}
        <section id="modules" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <BarChart3 className="h-3 w-3" />
              20+ modül
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Bir e-ticaret panelinde{" "}
              <span className="bg-gradient-to-br from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                olması gereken her şey
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
              KVKK, GİB, iyzico, kargo entegrasyonu — Türkiye'ye özel.
              Hepsi tek panelde.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-fuchsia-500/30 hover:bg-fuchsia-500/[0.03]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-white/70 transition group-hover:bg-fuchsia-500/15 group-hover:text-fuchsia-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{m.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Türkiye altyapısı tek kart ─── */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-black to-black p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                  <Receipt className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Türkiye altyapısı{" "}
                  <span className="bg-gradient-to-br from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                    tam destek
                  </span>
                </h3>
                <p className="mt-2 text-sm text-white/60 sm:text-base">
                  GİB e-fatura/e-arşiv, iyzico 3DS tahsilat, kargo entegrasyonu,
                  banka EFT/havale eşleştirme — tek API arkasında.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfraPill icon={Receipt} label="GİB" sub="e-fatura" />
                <InfraPill icon={CreditCard} label="iyzico" sub="3DS" />
                <InfraPill icon={Banknote} label="Banka" sub="havale match" />
                <InfraPill icon={Package} label="Kargo" sub="Aras/Yurtiçi" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Team ─── */}
        <section id="team" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70">
              <Users className="h-3 w-3" />
              Ekip
            </span>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                fatal exception team
              </span>
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Bu hackathon projesi 2 kişi tarafından yazıldı.
            </p>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            {TEAM.map((m) => (
              <TeamCard key={m.handle} member={m} />
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative overflow-hidden border-t border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(217,70,239,0.18),transparent_70%)]" />
          </div>
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Hazırsan{" "}
              <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                panele girelim
              </span>
            </h2>
            <p className="mt-4 text-sm text-white/60 sm:text-base">
              Demo hesap hazır — kayıt yok, kredi kartı yok, beklemek yok.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white text-black shadow-2xl shadow-fuchsia-500/20 hover:bg-white/90"
                >
                  Demo panele git
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="https://github.com/umutsrgncn/commerceos-ai"
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  GitHub'da incele
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/40">
              E-posta:{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/70">
                demo&#64;commerceos.dev
              </code>
              <span className="mx-1">·</span>
              Parola:{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/70">
                demo1234
              </code>
            </p>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-black">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <CommerceOSLogo size={28} />
              <span className="text-sm font-semibold">CommerceOS</span>
              <span className="text-xs text-white/40">
                © {new Date().getFullYear()} fatal exception team
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
              <Link href="/privacy" className="inline-flex items-center gap-1 hover:text-white">
                <FileText className="h-3 w-3" />
                Aydınlatma metni
              </Link>
              <Link href="/data-deletion" className="hover:text-white">
                Veri silme
              </Link>
              <Link
                href="https://github.com/umutsrgncn/commerceos-ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-white"
              >
                <Github className="h-3 w-3" />
                GitHub
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-3 py-1 font-medium text-fuchsia-300 hover:bg-fuchsia-500/25"
              >
                Panele git
                <ArrowRight className="h-3 w-3" />
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function GridPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.15]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
        <radialGradient id="fade" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask">
          <rect width="100%" height="100%" fill="url(#fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
    </svg>
  );
}

function Pill({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

function PipelineCard() {
  const steps = [
    {
      label: "Olay",
      title: "Trigger",
      desc: "Yorum / sipariş / havale / stok düşüşü",
      tone: "from-fuchsia-500 to-pink-500",
      dotColor: "bg-fuchsia-400",
    },
    {
      label: "Karar",
      title: "Gemini AI",
      desc: "Güven skoru hesaplar, eşik altında onay bekler",
      tone: "from-indigo-500 to-purple-500",
      dotColor: "bg-indigo-400",
    },
    {
      label: "Yazım",
      title: "Türkçe çıktı",
      desc: "Mail / cevap / fatura draft / SQL update",
      tone: "from-cyan-500 to-blue-500",
      dotColor: "bg-cyan-400",
    },
    {
      label: "Aksiyon",
      title: "DB · GİB · SMTP",
      desc: "Doğrudan sisteme yazar, audit log'a düşer",
      tone: "from-emerald-500 to-teal-500",
      dotColor: "bg-emerald-400",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <PulseBadge />
          <span className="text-xs text-white/55">İç akış</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">
          Otopilot{" "}
          <span className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
            pipeline'ı
          </span>
        </h3>

        <ol className="relative mt-5">
          {/* Connecting line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-fuchsia-500/40 via-indigo-500/40 to-emerald-500/40" />
          {steps.map((s) => (
            <li key={s.label} className="relative mb-4 last:mb-0 pl-10">
              <span
                className={`absolute left-0 top-0.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${s.tone} text-[10px] font-bold uppercase tracking-wider text-white shadow-lg`}
              >
                <span
                  className={`absolute h-9 w-9 rounded-full ${s.dotColor} opacity-30 blur-md`}
                />
                <span className="relative">{s.label[0]}</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                  {s.label}
                </span>
                <span className="font-semibold">{s.title}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-4 text-[10px] text-white/55">
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
            Audit log
          </span>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
            Geri alınabilir
          </span>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
            Bütçe limiti
          </span>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
            Güven eşiği
          </span>
        </div>
      </div>
    </div>
  );
}

function TechCell({
  title,
  desc,
  logo,
  accent,
  fg,
}: {
  title: string;
  desc: string;
  logo: React.ReactNode;
  accent: string;
  fg?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${accent} p-4 transition hover:border-white/20`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_70%)]" />
      <div className="relative flex items-start gap-3">
        <span className={`shrink-0 ${fg ?? "text-white/90"}`}>{logo}</span>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          <div className="mt-1 text-[10px] leading-snug text-white/55">
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfraPill({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="h-3.5 w-3.5 text-emerald-300" />
        {label}
      </div>
      <div className="mt-0.5 text-[10px] text-white/45">{sub}</div>
    </div>
  );
}

function TeamCard({
  member,
}: {
  member: (typeof TEAM)[number];
}) {
  const fromColor = member.color === "fuchsia" ? "from-fuchsia-500" : "from-indigo-500";
  return (
    <Link
      href={`https://github.com/${member.handle}`}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5 transition hover:border-white/15 hover:from-white/[0.05]"
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${fromColor} to-transparent opacity-20 blur-2xl transition group-hover:opacity-40`} />

      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{member.name}</div>
          <div className="mt-0.5 text-xs text-white/55">{member.title}</div>
          <div className="mt-1 font-mono text-[10px] text-white/40">
            @{member.handle}
          </div>
        </div>
        <Github className="h-4 w-4 text-white/30 transition group-hover:text-white/80" />
      </div>
    </Link>
  );
}

// ─── AI Showcase Cases ───────────────────────────────────────────────────────

type Tone = "neutral" | "success" | "warning" | "danger";

const COLOR_ACCENT: Record<string, string> = {
  amber: "from-amber-500/15 text-amber-300 ring-amber-500/30",
  emerald: "from-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  indigo: "from-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  blue: "from-blue-500/15 text-blue-300 ring-blue-500/30",
  purple: "from-purple-500/15 text-purple-300 ring-purple-500/30",
  pink: "from-pink-500/15 text-pink-300 ring-pink-500/30",
  red: "from-red-500/15 text-red-300 ring-red-500/30",
  cyan: "from-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  fuchsia: "from-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
  rose: "from-rose-500/15 text-rose-300 ring-rose-500/30",
  violet: "from-violet-500/15 text-violet-300 ring-violet-500/30",
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-white/40">
        {k}
      </span>
      <span className="font-mono text-xs text-white/85">{v}</span>
    </div>
  );
}

function DbChatShowcase() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-black to-indigo-950/30 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Bot className="h-3 w-3" />
            AI Asistan
          </span>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-br from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Veritabanı
            </span>
            'nla{" "}
            <span className="bg-gradient-to-br from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              konuş
            </span>
          </h3>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Asistan PostgreSQL veritabanına{" "}
            <strong className="text-white">read-only kullanıcı</strong> ile
            doğrudan SQL atar — sipariş, müşteri, stok, fatura, yorum tablolarına
            erişip Türkçe yanıt yazar. Mock değil, gerçek veri.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-white/55">
            {[
              "Order",
              "Customer",
              "Product",
              "Inventory",
              "Invoice",
              "Review",
              "BankTransaction",
              "Refund",
            ].map((t) => (
              <span
                key={t}
                className="rounded-md border border-cyan-500/20 bg-cyan-500/[0.06] px-2 py-0.5 font-mono text-cyan-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <ChatBubble
            side="user"
            text="Bu hafta en çok satan 3 ürünü ciroyla beraber söyler misin?"
          />
          <ChatBubble
            side="ai"
            sql={`SELECT p.name, SUM(oi.quantity) qty, SUM(oi.total) revenue
FROM "OrderItem" oi
JOIN "Product" p ON p.id = oi."productId"
JOIN "Order" o ON o.id = oi."orderId"
WHERE o."createdAt" >= NOW() - INTERVAL '7 days'
  AND o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 3;`}
            text="Bu hafta en çok satanlar:&#10;&#10;1. Pamuk Basic Tişört · 47 adet · ₺11.703&#10;2. Eşofman Altı Gri · 38 adet · ₺18.962&#10;3. Spor Sweatshirt · 29 adet · ₺14.490&#10;&#10;Toplam ciro: ₺45.155 — geçen haftadan %18 yüksek."
          />
          <ChatBubble
            side="user"
            text="Eşofman altının stoğu nasıl, sipariş açmalı mıyım?"
          />
          <ChatBubble
            side="ai"
            sql={`SELECT i.quantity, p.name
FROM "Inventory" i
JOIN "Product" p ON p.id = i."productId"
WHERE p.sku = 'PT-ESOFMAN-ALTI-GRI-193';`}
            text="PT-ESOFMAN-ALTI-GRI-193: 3 adet stok kaldı (kritik). Tedarikçinizde 5 iş günü teslim. Otopilot'tan onaylarsan AI tedarikçiye sipariş maili yazabilir."
          />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  side,
  text,
  sql,
}: {
  side: "user" | "ai";
  text: string;
  sql?: string;
}) {
  const isUser = side === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[88%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm"
            : "max-w-[92%] rounded-2xl rounded-bl-md border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] to-indigo-500/[0.06] px-3.5 py-2.5 text-sm"
        }
      >
        {!isUser && sql && (
          <div className="mb-2 rounded-lg border border-cyan-500/20 bg-black/40 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300/80">
              <Database className="h-2.5 w-2.5" />
              SQL · read-only kullanıcı
            </div>
            <code className="block whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-cyan-100/90">
              {sql}
            </code>
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed text-white/90">
          {text}
        </div>
      </div>
    </div>
  );
}

function AIToolCard({
  icon: Icon,
  color,
  title,
  subtitle,
  left,
  right,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  subtitle: string;
  left: React.ReactNode;
  right: React.ReactNode;
  meta: string;
}) {
  const accent = COLOR_ACCENT[color] ?? COLOR_ACCENT.indigo;
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent p-5">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
        <span className="hidden rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline-flex">
          AI
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1.3fr] sm:items-stretch">
        <div className="min-w-0">{left}</div>
        <div className="hidden items-center justify-center text-fuchsia-400 sm:flex">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="min-w-0">{right}</div>
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-white/40">
        <Sparkles className="mr-1 inline h-2.5 w-2.5" />
        {meta}
      </div>
    </div>
  );
}

function AICase(props: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  subtitle: string;
  meta: string;
  full?: boolean;
  variant?: "chat" | "stack" | "mail" | "match" | "segment" | "price" | "anomaly";
  flow?: { side: "in" | "out"; author: string; text: string }[];
  cards?: { label: string; title: string; body: string; tone: Tone }[];
  mail?: { to: string; subject: string; body: string };
  match?: {
    bank: { amount: string; desc: string; date: string };
    order: { number: string; customer: string; total: string };
    confidence: number;
  };
  segment?: {
    customer: string;
    stats: { l: string; v: string }[];
    label: string;
    reasoning: string;
    action: string;
  };
  price?: {
    product: string;
    current: string;
    suggested: string;
    delta: string;
    reasoning: string;
  };
  anomaly?: {
    metric: string;
    title: string;
    current: string;
    baseline: string;
    changePct: number;
    severity: string;
    explanation: string;
    action: string;
  };
}) {
  const Icon = props.icon;
  const accent = COLOR_ACCENT[props.color] ?? COLOR_ACCENT.indigo;
  const variant = props.variant ?? "chat";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent p-5 ${
        props.full ? "lg:col-span-2" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold">{props.title}</h3>
          <p className="text-xs text-white/50">{props.subtitle}</p>
        </div>
        <span className="hidden rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300 sm:inline-flex">
          AI
        </span>
      </div>

      {/* Body */}
      <div className="mt-4">
        {variant === "chat" && props.flow && (
          <div className="space-y-2">
            {props.flow.map((m, i) => (
              <div
                key={i}
                className={
                  m.side === "in"
                    ? "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    : "rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/[0.06] p-3"
                }
              >
                <div
                  className={
                    m.side === "in"
                      ? "flex items-center gap-1.5 text-[10px] text-white/50"
                      : "flex items-center gap-1.5 text-[10px] text-fuchsia-300"
                  }
                >
                  {m.side === "in" ? (
                    <Star className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {m.author}
                </div>
                <div className="mt-1 text-sm leading-relaxed text-white/85">
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {variant === "stack" && props.cards && (
          <div className="space-y-2">
            {props.cards.map((c, i) => (
              <div
                key={i}
                className={
                  c.tone === "success"
                    ? "rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3"
                    : "rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
                }
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {c.label}
                </div>
                <div className="mt-1 text-sm font-medium">{c.title}</div>
                <div className="mt-0.5 text-xs text-white/55">{c.body}</div>
              </div>
            ))}
            <div className="ml-1 flex items-center gap-1.5 text-[10px] text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Otopilot tetik → AI → DB · 12sn
            </div>
          </div>
        )}

        {variant === "mail" && props.mail && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] font-mono text-[11px]">
            <div className="border-b border-white/[0.06] px-3 py-2">
              <div className="flex items-center gap-2 text-white/50">
                <Mail className="h-3 w-3" />
                <span>Kime: {props.mail.to}</span>
              </div>
              <div className="mt-1 text-white/85">
                <span className="text-white/50">Konu:</span>{" "}
                {props.mail.subject}
              </div>
            </div>
            <div className="whitespace-pre-wrap px-3 py-3 text-white/75 leading-relaxed">
              {props.mail.body}
            </div>
          </div>
        )}

        {variant === "match" && props.match && (
          <div>
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.05] p-3">
                <div className="text-[10px] uppercase tracking-wider text-blue-300">
                  Banka satırı
                </div>
                <div className="mt-1 font-mono text-sm">
                  {props.match.bank.amount}
                </div>
                <div className="mt-0.5 text-[10px] text-white/55">
                  {props.match.bank.desc}
                </div>
                <div className="mt-0.5 text-[10px] text-white/40">
                  {props.match.bank.date}
                </div>
              </div>
              <div className="flex items-center justify-center text-fuchsia-400">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">
                  Eşleşen sipariş
                </div>
                <div className="mt-1 font-mono text-sm">
                  {props.match.order.number}
                </div>
                <div className="mt-0.5 text-[10px] text-white/55">
                  {props.match.order.customer} · {props.match.order.total}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-300">
              <ScanLine className="h-3 w-3" />
              AI eşleştirme güveni: %{props.match.confidence}
            </div>
          </div>
        )}

        {variant === "segment" && props.segment && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
              <div className="text-sm">{props.segment.customer}</div>
              <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                {props.segment.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {props.segment.stats.map((s) => (
                <div
                  key={s.l}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center"
                >
                  <div className="font-mono text-sm">{s.v}</div>
                  <div className="text-[9px] uppercase tracking-wider text-white/45">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                Gerekçe
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                {props.segment.reasoning}
              </p>
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                Önerilen aksiyon
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                {props.segment.action}
              </p>
            </div>
          </div>
        )}

        {variant === "price" && props.price && (
          <div className="space-y-3">
            <div className="text-sm font-medium">{props.price.product}</div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/45">
                  Mevcut
                </div>
                <div className="mt-0.5 font-mono text-sm line-through opacity-60">
                  {props.price.current}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-fuchsia-400" />
              <div className="rounded-xl border border-pink-500/30 bg-pink-500/[0.06] px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-pink-300">
                  AI öneri
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold">
                  {props.price.suggested}
                </div>
              </div>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-mono text-red-300">
                {props.price.delta}
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Gerekçe
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                {props.price.reasoning}
              </p>
            </div>
          </div>
        )}

        {variant === "anomaly" && props.anomaly && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  {props.anomaly.metric} · {props.anomaly.severity}
                </div>
                <div className="mt-1 text-base font-semibold">
                  {props.anomaly.title}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">
                  {props.anomaly.current}
                </div>
                <div className="text-[10px] text-white/40">
                  baseline {props.anomaly.baseline}
                </div>
                <div className="text-[10px] font-mono text-red-300">
                  +{props.anomaly.changePct}%
                </div>
              </div>
            </div>
            <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed text-white/75">
              <span className="font-semibold text-white/85">Açıklama:</span>{" "}
              {props.anomaly.explanation}
            </p>
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-xs leading-relaxed text-white/75">
              <span className="font-semibold text-emerald-300">Aksiyon:</span>{" "}
              {props.anomaly.action}
            </p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-white/40">
        <RefreshCw className="mr-1 inline h-2.5 w-2.5" />
        {props.meta}
      </div>
    </div>
  );
}
