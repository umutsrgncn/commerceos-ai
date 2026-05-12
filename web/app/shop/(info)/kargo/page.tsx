import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

export const metadata = { title: "Kargo ve Teslimat · Pamuk" };

const SHIPPING_OPTIONS = [
  {
    title: "Standart kargo",
    duration: "2-3 iş günü",
    price: "49,90 ₺",
    carriers: ["Aras Kargo", "Yurtiçi Kargo", "MNG Kargo", "PTT"],
    description: "Türkiye'nin her noktasına. 750 ₺ üzeri ücretsiz.",
  },
  {
    title: "Ekspres kargo",
    duration: "1 iş günü",
    price: "99,90 ₺",
    carriers: ["MNG Aynı Gün", "Aras Express"],
    description:
      "Saat 14:00'dan önce verilen siparişler, İstanbul/Ankara/İzmir için aynı gün.",
  },
];

const REGIONS = [
  { name: "İstanbul, Ankara, İzmir", days: "1-2 gün" },
  { name: "Büyükşehirler (Bursa, Antalya, vb.)", days: "2-3 gün" },
  { name: "Anadolu illeri", days: "3-4 gün" },
  { name: "Köy/uzak noktalar", days: "4-5 gün" },
];

export default function ShippingPage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            Türkiye geneli
          </p>
          <h1 className="font-display text-4xl italic leading-tight sm:text-5xl">
            Kargo & Teslimat
          </h1>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
        Türkiye'nin her noktasına, 4 farklı kargo firması ile çalışıyoruz.
        Adresine en yakın depo otomatik seçilir; çoğu sipariş 2-3 iş gününde
        kapına gelir.
      </p>

      {/* Kargo seçenekleri */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {SHIPPING_OPTIONS.map((opt) => (
          <div
            key={opt.title}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl italic">{opt.title}</h2>
              <span className="font-mono text-base font-semibold tabular-nums">
                {opt.price}
              </span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[color:var(--color-accent)]">
              <Clock className="h-3 w-3" />
              {opt.duration}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-muted)]">
              {opt.description}
            </p>
            <div className="mt-5 border-t border-[color:var(--color-border)] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
                Anlaşmalı firmalar
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {opt.carriers.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-[color:var(--color-fg)]/[0.04] px-2 py-0.5 text-[10px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Bölgeye göre süreler */}
      <section className="mt-12">
        <h2 className="font-display text-3xl italic">Bölgeye göre süre</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
          <ul className="divide-y divide-[color:var(--color-border)]">
            {REGIONS.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-[color:var(--color-fg)]/85">{r.name}</span>
                <span className="font-mono text-[color:var(--color-accent)] font-semibold tabular-nums">
                  {r.days}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Önemli bilgiler */}
      <section className="mt-12">
        <h2 className="font-display text-3xl italic">İyi bilmek için</h2>
        <ul className="mt-5 space-y-3">
          {[
            "Saat 14:00'a kadar verilen siparişler aynı gün kargoya verilir.",
            "Hafta sonu siparişlerin kargoya verilmesi Pazartesi'dir.",
            "750 ₺ ve üzeri standart kargo bedava — kupon kullansan bile geçerli.",
            "Adres değişikliği için kargoya verilmeden önce iletişime geç.",
            "Kargo kutusu hasarlıysa kuryede tutanak tut, fotoğraflayıp bize gönder.",
            "Teslimat denemesi başarısız olursa kargo şubesinde 7 gün bekler.",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-accent)] mt-0.5" />
              <span className="text-[color:var(--color-fg)]/85">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Paket */}
      <section className="mt-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl italic">
          <Package className="h-5 w-5 text-[color:var(--color-accent)]" />
          Paketleme
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
          Her ürünü %100 geri dönüştürülmüş krafft kağıt + organik pamuk ipi ile
          paketliyoruz. Plastik kullanmıyoruz. Hediye paketi tercih edersen ödeme
          adımında not bırakabilirsin — kutuya el yazılı bir not ekleriz.
        </p>
      </section>
    </>
  );
}
