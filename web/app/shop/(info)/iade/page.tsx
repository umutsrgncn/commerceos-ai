import { CheckCircle2, Mail, Package, RefreshCcw, XCircle } from "lucide-react";

export const metadata = { title: "İade ve Değişim · Pamuk" };

const STEPS = [
  {
    title: "Teslimat tarihini başlangıç al",
    detail:
      "Ürünü teslim aldığın günden itibaren 14 günlük yasal cayma hakkın başlar.",
  },
  {
    title: "Hesabına gir, iadeyi başlat",
    detail:
      "Hesabım › Siparişlerim sayfasından ilgili sipariş için 'İade et' butonuna bas. İade sebebini seç.",
  },
  {
    title: "Kargo kodunu yazdır",
    detail:
      "E-posta ile gelen kargo kodunu yazdır, paketin üzerine yapıştır. Anlaşmalı kuryeden teslimat al, ücret yok.",
  },
  {
    title: "İade tutarı hesabına geçer",
    detail:
      "Ürün depoya ulaştığında 3 iş günü içinde aynı ödeme yöntemine iade yapılır. Banka süreciyle birlikte toplam 1-7 iş günü.",
  },
];

const KOSULLAR_VAR = [
  "Etiketleri sökülmemiş, kullanılmamış ürünler",
  "Orijinal ambalajıyla beraber",
  "Hijyenik ürün ambalajı açılmamış (iç giyim, çorap, mayo, bebek bezi)",
  "İade formu ile birlikte gönderim",
];

const KOSULLAR_YOK = [
  "Kullanılmış / yıkanmış / lekelenmiş ürünler",
  "Hijyenik ambalajı açılmış iç giyim, mayo",
  "İndirim kupon koduyla alınan promosyon ürünleri (özel kampanyalar hariç)",
  "Hediye paketi olarak özelleştirilmiş ürünler",
];

export default function ReturnsPage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
          <RefreshCcw className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            14 gün ücretsiz iade
          </p>
          <h1 className="font-display text-4xl italic leading-tight sm:text-5xl">
            İade & Değişim
          </h1>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
        Aldığın üründen memnun değilsen, etiketleri sökülmemiş ve kullanılmamış
        olmak şartıyla 14 gün içinde sorgusuz iade edebilirsin. Kargo ücreti
        bizden.
      </p>

      {/* 4 adım */}
      <section className="mt-12">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          Nasıl iade edilir
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={i}
              className="relative rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] text-xs font-bold">
                {i + 1}
              </span>
              <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-muted)]">
                {s.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Şartlar */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.04] p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl italic">
            <CheckCircle2 className="h-5 w-5 text-[color:var(--color-accent)]" />
            İade edilebilir
          </h2>
          <ul className="mt-4 space-y-2">
            {KOSULLAR_VAR.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
                <span className="text-[color:var(--color-fg)]/85">{k}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl italic">
            <XCircle className="h-5 w-5 text-red-500" />
            İade edilemez
          </h2>
          <ul className="mt-4 space-y-2">
            {KOSULLAR_YOK.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                <span className="text-[color:var(--color-fg)]/85">{k}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Değişim */}
      <section className="mt-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl italic">
          <Package className="h-5 w-5 text-[color:var(--color-accent)]" />
          Değişim — beden / renk
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
          Doğrudan beden veya renk değişimi yapılmaz. Önce iade sürecini
          başlatırsın, hesabına tutar geçtikten sonra istediğin yeni ürünü
          sipariş edersin. Hızlı çözüm için: iade kargosunu bekleyip yeni
          siparişini paralel olarak verebilirsin.
        </p>
      </section>

      {/* İletişim CTA */}
      <section className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl bg-[color:var(--color-fg)] p-6 text-[color:var(--color-bg)] sm:p-8">
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-display text-2xl italic">
            Hâlâ kafanda soru var mı?
          </h2>
          <p className="mt-2 text-xs opacity-80">
            Sipariş numaranı yazıp iletişim formundan ulaş, hızlıca çözelim.
          </p>
        </div>
        <a
          href="/shop/iletisim"
          className="inline-flex items-center gap-2 rounded-md bg-[color:var(--color-bg)] px-5 py-3 text-sm font-medium text-[color:var(--color-fg)] hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-accent-fg)]"
        >
          <Mail className="h-4 w-4" />
          İletişime geç
        </a>
      </section>
    </>
  );
}
