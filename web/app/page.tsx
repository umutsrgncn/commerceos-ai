import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  CreditCard,
  FileText,
  Github,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Button } from "@/components/ui/button";

// React Bits
import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import FadeContent from "@/components/reactbits/FadeContent";
import Magnet from "@/components/reactbits/Magnet";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GlareHover from "@/components/reactbits/GlareHover";
import BorderGlow from "@/components/reactbits/BorderGlow";
import ProfileCard from "@/components/reactbits/ProfileCard";
import DomeGallery from "@/components/reactbits/DomeGallery";
import ScrollStack, {
  ScrollStackItem,
} from "@/components/reactbits/ScrollStack";
import DarkVeil from "@/components/reactbits/DarkVeil";

export const metadata = {
  title: "CommerceOS — AI-destekli e-ticaret yönetim paneli",
  description:
    "Sipariş, ürün, müşteri, e-fatura, banka, KVKK, ödeme — hepsi tek panelde. Otopilot ile günlük operasyonu AI yönetir.",
};

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Sipariş yönetimi",
    description: "Stok rezervasyonu, kargo, durum geçişleri, toplu fatura",
    iconClass: "bg-indigo-500/15 text-indigo-300",
    spot: "rgba(99, 102, 241, 0.22)",
  },
  {
    icon: Package,
    title: "Ürün & envanter",
    description: "AI açıklama + görsel üretimi, otomatik stok takibi",
    iconClass: "bg-fuchsia-500/15 text-fuchsia-300",
    spot: "rgba(217, 70, 239, 0.22)",
  },
  {
    icon: Users,
    title: "Müşteri segmentasyonu",
    description: "Sadık / VIP / risky — AI geçmişe bakıp segmentler",
    iconClass: "bg-emerald-500/15 text-emerald-300",
    spot: "rgba(16, 185, 129, 0.22)",
  },
  {
    icon: Receipt,
    title: "GİB e-fatura",
    description: "E-fatura ve e-arşiv kesme, otopilot otomatik",
    iconClass: "bg-amber-500/15 text-amber-300",
    spot: "rgba(245, 158, 11, 0.22)",
  },
  {
    icon: CreditCard,
    title: "iyzico tahsilat",
    description: "Sandbox + üretim, 3DS callback, otomatik link",
    iconClass: "bg-rose-500/15 text-rose-300",
    spot: "rgba(244, 63, 94, 0.22)",
  },
  {
    icon: TrendingUp,
    title: "Finans & cash flow",
    description: "Kâr/zarar, AI 30g tahmin, anomali tespiti",
    iconClass: "bg-cyan-500/15 text-cyan-300",
    spot: "rgba(6, 182, 212, 0.22)",
  },
  {
    icon: ShieldCheck,
    title: "KVKK uyumu",
    description: "Çerez banner, AI aydınlatma metni, veri silme",
    iconClass: "bg-violet-500/15 text-violet-300",
    spot: "rgba(139, 92, 246, 0.22)",
  },
  {
    icon: Bot,
    title: "Otopilot modu",
    description: "Yorum, e-fatura, stok, havale — 7 farklı işi AI",
    iconClass: "bg-pink-500/15 text-pink-300",
    spot: "rgba(236, 72, 153, 0.22)",
  },
];

const STATS = [
  { value: 20, suffix: "+", label: "Entegre modül" },
  { value: 7, suffix: "", label: "Otopilot kabiliyeti" },
  { value: 100, suffix: "%", label: "KVKK uyumlu" },
];

const OTOPILOT_ITEMS = [
  "Müşteri yorumlarına Türkçe cevap",
  "Sipariş onayında e-fatura kesimi",
  "Kritik stoğa tedarikçi siparişi",
  "Banka havalelerini eşleştirme",
  "Yavaş ürünlere fiyat önerisi",
  "Müşteri segmentasyonu",
  "Negatif yorum sentiment + flag",
];

const SWAP_PAGES = [
  { src: "/team/shot-dashboard.jpg", title: "Dashboard" },
  { src: "/team/shot-orders.jpg", title: "Siparişler" },
  { src: "/team/shot-autopilot.jpg", title: "Otopilot" },
  { src: "/team/shot-finance.jpg", title: "Finans" },
  { src: "/team/shot-kvkk.jpg", title: "KVKK" },
];

const DOME_IMAGES = [
  { src: "/team/shot-dashboard.jpg", alt: "Dashboard" },
  { src: "/team/shot-orders.jpg", alt: "Siparişler" },
  { src: "/team/shot-products.jpg", alt: "Ürünler" },
  { src: "/team/shot-finance.jpg", alt: "Finans" },
  { src: "/team/shot-customers.jpg", alt: "Müşteriler" },
  { src: "/team/shot-autopilot.jpg", alt: "Otopilot" },
  { src: "/team/shot-kvkk.jpg", alt: "KVKK" },
  { src: "/team/shot-analytics.jpg", alt: "Analitik" },
];

const BRAND_COLORS = ["#a78bfa", "#e879f9", "#34d399", "#a78bfa"];

export default function HomePage() {
  return (
    <>
      {/* Body scrollbar gizle */}
      <style>{`body { overflow-x: hidden; scrollbar-width: none; }
              body::-webkit-scrollbar { display: none; }`}</style>

      <main className="relative bg-black text-white selection:bg-fuchsia-500/40">
        {/* ─── Hero — DarkVeil background ─── */}
        <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
          <div className="absolute inset-0 -z-30">
            <DarkVeil
              hueShift={280}
              noiseIntensity={0.02}
              scanlineIntensity={0}
              speed={0.5}
              warpAmount={0.25}
            />
          </div>
          {/* Vignette */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_55%,#000_100%)]" />

          {/* Top bar */}
          <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                CommerceOS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="https://github.com/umutsrgncn/commerceos-ai"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 backdrop-blur transition hover:border-white/20 hover:text-white sm:inline-flex"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Link>
              <Magnet padding={40} magnetStrength={4}>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.1] hover:text-white"
                  >
                    Giriş yap
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Magnet>
            </div>
          </nav>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-10 text-center">
            <AnimatedContent
              distance={20}
              direction="vertical"
              duration={0.6}
              delay={0.05}
            >
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
                <ShinyText
                  text="Powered by fatal exception team"
                  speed={3}
                  color="rgba(255,255,255,0.7)"
                  shineColor="#ffffff"
                  className="text-xs"
                />
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </Link>
            </AnimatedContent>

            <div className="mt-7 max-w-4xl">
              <BlurText
                text="E-ticaretini AI yönetsin,"
                delay={80}
                animateBy="words"
                direction="top"
                className="justify-center text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
              />
              <BlurText
                text="sen büyümeye odaklan"
                delay={80}
                animateBy="words"
                direction="top"
                className="mt-2 justify-center text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
              />
            </div>

            <AnimatedContent
              distance={20}
              direction="vertical"
              duration={0.7}
              delay={0.4}
            >
              <p className="mt-6 max-w-xl text-pretty text-base text-white/70 sm:text-lg">
                Sipariş, ürün, müşteri, e-fatura, banka, KVKK — tek panelde.
                Otopilot günlük operasyonu yönetir, sen sadece onaylarsın.
              </p>
            </AnimatedContent>

            <AnimatedContent
              distance={20}
              direction="vertical"
              duration={0.7}
              delay={0.55}
            >
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Magnet padding={50} magnetStrength={6}>
                  <Link href="/login">
                    <ShimmerButton>
                      Demo panele git
                      <ArrowRight className="h-4 w-4" />
                    </ShimmerButton>
                  </Link>
                </Magnet>
                <Magnet padding={50} magnetStrength={6}>
                  <Link href="#showcase">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
                    >
                      Sayfalara göz at
                    </Button>
                  </Link>
                </Magnet>
              </div>
            </AnimatedContent>

            <FadeContent duration={900} delay={700}>
              <div className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-2 sm:gap-3">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
                  >
                    <div className="text-2xl font-semibold tabular-nums sm:text-3xl">
                      <GradientText
                        colors={BRAND_COLORS}
                        animationSpeed={10}
                        className="inline-block"
                      >
                        <CountUp
                          to={s.value}
                          duration={1.4}
                          separator=""
                          className="inline-block"
                        />
                        {s.suffix}
                      </GradientText>
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </FadeContent>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black" />
        </section>

        {/* ─── Showcase: ScrollStack — scroll'da yığılan büyük preview kartları ─── */}
        <section
          id="showcase"
          className="relative mx-auto max-w-6xl px-6 pt-24 pb-12"
        >
          <FadeContent duration={700}>
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                <Zap className="h-3 w-3" />
                Sayfa önizleme
              </span>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Aşağı kaydır,{" "}
                <GradientText
                  colors={BRAND_COLORS}
                  animationSpeed={7}
                  className="inline-block"
                >
                  modüller yığılsın
                </GradientText>
              </h2>
              <p className="mt-3 text-sm text-white/60 sm:text-base">
                Dashboard, siparişler, otopilot, finans, KVKK — büyük preview'lar.
              </p>
            </div>
          </FadeContent>

          <div className="relative h-[640px] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
            <ScrollStack
              useWindowScroll
              itemDistance={120}
              itemScale={0.04}
              itemStackDistance={36}
              stackPosition="22%"
              scaleEndPosition="14%"
              baseScale={0.85}
              rotationAmount={1.5}
              blurAmount={0.5}
              onStackComplete={undefined}
            >
              {SWAP_PAGES.map((p) => (
                <ScrollStackItem
                  key={p.title}
                  itemClassName="!bg-black !rounded-3xl !border !border-white/15 overflow-hidden !p-0"
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={p.src}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 960px, 90vw"
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        CommerceOS
                      </div>
                      <div className="mt-1 text-2xl font-semibold sm:text-3xl">
                        {p.title}
                      </div>
                    </div>
                  </div>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        </section>

        {/* ─── Features grid (SpotlightCard) ─── */}
        <section className="relative mx-auto max-w-6xl px-6 py-12">
          <FadeContent duration={700}>
            <div className="mb-12 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                <Zap className="h-3 w-3" />
                Modüller
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                Aklına gelen{" "}
                <GradientText
                  colors={BRAND_COLORS}
                  animationSpeed={7}
                  className="inline-block"
                >
                  her şey hazır
                </GradientText>
              </h2>
              <p className="mt-3 text-sm text-white/60 sm:text-base">
                Hepsi entegre, hepsi AI'a bağlı, hepsi tek panelde.
              </p>
            </div>
          </FadeContent>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <AnimatedContent
                  key={f.title}
                  distance={30}
                  direction="vertical"
                  duration={0.5}
                  delay={0.05 * idx}
                  threshold={0.1}
                >
                  <SpotlightCard
                    className="!bg-white/[0.02] !border-white/[0.08] h-full transition hover:!border-fuchsia-500/30"
                    spotlightColor={
                      f.spot as `rgba(${number}, ${number}, ${number}, ${number})`
                    }
                  >
                    <span
                      className={`mb-4 grid h-10 w-10 place-items-center rounded-xl transition ${f.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                      {f.description}
                    </p>
                  </SpotlightCard>
                </AnimatedContent>
              );
            })}
          </div>
        </section>

        {/* ─── DomeGallery — büyük, renkli ─── */}
        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <FadeContent duration={700}>
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                <Sparkles className="h-3 w-3" />
                360° tur
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                <GradientText
                  colors={BRAND_COLORS}
                  animationSpeed={8}
                  className="inline-block"
                >
                  Sürükle
                </GradientText>{" "}
                ve bütün sayfalara bak
              </h2>
              <p className="mt-3 text-sm text-white/60 sm:text-base">
                Mouse'la dome'u döndür, bir sayfaya tıkla → büyük önizleme açılır.
              </p>
            </div>
          </FadeContent>

          <BorderGlow
            glowColor="#e879f9"
            backgroundColor="#0a0a0a"
            borderRadius={24}
            glowIntensity={1.2}
            edgeSensitivity={120}
          >
            <div className="relative h-[640px] w-full overflow-hidden rounded-3xl">
              <DomeGallery
                images={DOME_IMAGES}
                fit={0.65}
                grayscale={false}
                overlayBlurColor="#000000"
                segments={24}
                minRadius={500}
                openedImageWidth="720px"
                openedImageHeight="460px"
                imageBorderRadius="14px"
                openedImageBorderRadius="14px"
              />
            </div>
          </BorderGlow>
        </section>

        {/* ─── Otopilot showcase ─── */}
        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          <BorderGlow
            glowColor="#e879f9"
            backgroundColor="#0a0a0a"
            borderRadius={24}
            glowIntensity={1.4}
            edgeSensitivity={150}
            animated
          >
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14">
              <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-fuchsia-500/20 blur-3xl" />

              <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                    </span>
                    Otopilot Modu
                  </span>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Operasyonu AI yönetsin,{" "}
                    <GradientText
                      colors={["#e879f9", "#a78bfa", "#e879f9"]}
                      animationSpeed={6}
                      className="inline-block"
                    >
                      sen stratejiye odaklan
                    </GradientText>
                  </h2>
                  <p className="mt-4 max-w-xl text-sm text-white/60 sm:text-base">
                    Otopilot bütçe + güven eşiği sınırları içinde 7 farklı işi
                    otomatik yapar. Her aksiyon log'lanır, geri alınabilir.
                  </p>
                  <Magnet padding={50} magnetStrength={5}>
                    <Link href="/login" className="mt-6 inline-block">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-fuchsia-500/30 bg-fuchsia-500/10 text-white hover:bg-fuchsia-500/20 hover:text-white"
                      >
                        <Bot className="h-4 w-4" />
                        Demoyu canlı dene
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </Magnet>
                </div>

                <ul className="grid grid-cols-1 gap-2 sm:gap-2.5">
                  {OTOPILOT_ITEMS.map((item, idx) => (
                    <AnimatedContent
                      key={item}
                      distance={15}
                      direction="horizontal"
                      reverse
                      duration={0.5}
                      delay={0.05 * idx}
                      threshold={0.05}
                    >
                      <GlareHover
                        width="100%"
                        height="auto"
                        background="rgba(255,255,255,0.02)"
                        borderRadius="12px"
                        borderColor="rgba(255,255,255,0.06)"
                        glareColor="#e879f9"
                        glareOpacity={0.25}
                        glareAngle={-30}
                        glareSize={200}
                        transitionDuration={700}
                        className="!h-auto !w-full"
                      >
                        <div className="flex items-start gap-2.5 p-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 text-fuchsia-300">
                            <Sparkles className="h-3 w-3" />
                          </span>
                          <span className="text-sm text-white/85">{item}</span>
                        </div>
                      </GlareHover>
                    </AnimatedContent>
                  ))}
                </ul>
              </div>
            </div>
          </BorderGlow>
        </section>

        {/* ─── Team — ProfileCard'lar ─── */}
        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          <FadeContent duration={700}>
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                <Users className="h-3 w-3" />
                Ekip
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                <GradientText
                  colors={BRAND_COLORS}
                  animationSpeed={7}
                  className="inline-block"
                >
                  fatal exception team
                </GradientText>
              </h2>
              <p className="mt-3 text-sm text-white/60 sm:text-base">
                Bu hackathon projesi 2 kişi tarafından yazıldı.
              </p>
            </div>
          </FadeContent>

          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-16">
            <ProfileCard
              name="Umut Sargıncan"
              title="Full-stack & AI"
              handle="umutsrgncn"
              status="Online"
              contactText="GitHub"
              avatarUrl="/team/umut.jpg"
              showUserInfo
              enableTilt
              enableMobileTilt
              behindGlowEnabled
              behindGlowColor="rgba(232, 121, 249, 0.55)"
              behindGlowSize="large"
              innerGradient="linear-gradient(145deg,#3b1f5c 0%,#71C4FF44 100%)"
              miniAvatarUrl={undefined}
              onContactClick={undefined}
            />
            <ProfileCard
              name="Çiğdem Kılıç"
              title="Full-stack & UI"
              handle="cigdemkilic"
              status="Online"
              contactText="GitHub"
              avatarUrl="/team/cigdem.jpg"
              showUserInfo
              enableTilt
              enableMobileTilt
              behindGlowEnabled
              behindGlowColor="rgba(167, 139, 250, 0.55)"
              behindGlowSize="large"
              innerGradient="linear-gradient(145deg,#1f2b5c 0%,#FF9FFC44 100%)"
              miniAvatarUrl={undefined}
              onContactClick={undefined}
            />
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative mx-auto max-w-4xl px-6 pb-24 text-center">
          <FadeContent duration={700}>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Hazırsan{" "}
              <GradientText
                colors={BRAND_COLORS}
                animationSpeed={5}
                className="inline-block"
              >
                panele girelim
              </GradientText>
            </h2>
            <p className="mt-4 text-sm text-white/60 sm:text-base">
              Demo hesap hazır — kredi kartı, kurulum, beklemek yok.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Magnet padding={60} magnetStrength={5}>
                <Link href="/login">
                  <ShimmerButton>
                    demo@commerceos.dev ile gir
                    <ArrowRight className="h-4 w-4" />
                  </ShimmerButton>
                </Link>
              </Magnet>
            </div>
          </FadeContent>
        </section>

        <footer className="relative border-t border-white/[0.06] bg-black">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold">CommerceOS</span>
              <span className="text-xs text-white/40">
                © {new Date().getFullYear()} fatal exception team
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 hover:text-white"
              >
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
