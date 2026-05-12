import { HelpCircle } from "lucide-react";

export const metadata = { title: "Sıkça Sorulanlar · Pamuk" };

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Sipariş",
    items: [
      {
        q: "Siparişimi nasıl takip edebilirim?",
        a: "Sipariş onay e-postandaki linki tıklayarak veya 'Hesabım › Siparişlerim' bölümünden anlık olarak takip edebilirsin. Kargoya verildiğinde takip numarası ve kargo firması linki sayfada görünür hale gelir.",
      },
      {
        q: "Sipariş verdikten sonra iptal edebilir miyim?",
        a: "Sipariş 'Kargoya verildi' durumuna geçmediği sürece müşteri hizmetleriyle iletişime geçerek iptal ettirebilirsin. Kargoya verildikten sonra ürünü teslim aldığında iade sürecini başlatman gerekir.",
      },
      {
        q: "Hesap açmadan sipariş verebilir miyim?",
        a: "Hayır, sipariş için kısa bir hesap açman gerekir. Sadece e-posta, ad ve şifre yeterli. Hesabın varsa siparişlerini her yerden takip edebilirsin.",
      },
    ],
  },
  {
    category: "Kargo",
    items: [
      {
        q: "Kargo ücreti ne kadar?",
        a: "Standart kargo 49,90 ₺, ekspres kargo 99,90 ₺. 750 ₺ ve üzeri tüm siparişlerde kargo ücretsiz.",
      },
      {
        q: "Ne kadar sürede teslim alırım?",
        a: "Standart kargo seçimiyle 2-3 iş günü, ekspres ile 1 iş günü içinde kapına gelir. Sipariş saat 14:00'a kadar verilirse aynı gün kargoya verilir.",
      },
      {
        q: "Hangi kargo firmalarıyla çalışıyorsunuz?",
        a: "Aras Kargo, Yurtiçi Kargo, MNG Kargo ve PTT ile çalışıyoruz. Bölgeye göre en hızlı firma otomatik seçilir.",
      },
    ],
  },
  {
    category: "İade & Değişim",
    items: [
      {
        q: "İade için kaç günüm var?",
        a: "Ürünü teslim aldığın tarihten itibaren 14 gün içinde herhangi bir sebep belirtmeden iade hakkın var. Etiketleri sökülmemiş, kullanılmamış ürünler kabul edilir.",
      },
      {
        q: "İade ücreti ödüyor muyum?",
        a: "Hayır, iade kargo bedava. Sana özel kargo kodu e-posta ile gönderilir, bunu yazdırıp paketin üzerine yapıştırman yeterli.",
      },
      {
        q: "İade tutarı ne kadar sürede hesabıma geçer?",
        a: "Ürün depomuza ulaştığı andan itibaren 3 iş günü içinde aynı ödeme yöntemi ile iade gerçekleşir. Bankaya yansıması 1-7 iş günü sürebilir.",
      },
    ],
  },
  {
    category: "Ödeme",
    items: [
      {
        q: "Hangi ödeme yöntemleri kabul ediliyor?",
        a: "Visa, Mastercard, Troy, American Express ve banka kartlarıyla ödeme yapabilirsin. Taksit seçenekleri ödeme sayfasında bankana göre görünür.",
      },
      {
        q: "Kart bilgilerim güvende mi?",
        a: "Tüm ödemeler SSL şifreli kanaldan iyzico altyapısı üzerinden geçer. Kart bilgilerin sistemimize asla kaydedilmez, sadece banka tarafında işlenir.",
      },
      {
        q: "Taksit yapabilir miyim?",
        a: "Evet, 250 ₺ ve üzeri siparişlerde 2-9 taksit seçenekleri ödeme adımında otomatik gösterilir. Komisyon yansıtılmaz, ek ücret yok.",
      },
    ],
  },
  {
    category: "Hesap",
    items: [
      {
        q: "Şifremi unuttum, ne yapmalıyım?",
        a: "Şu an şifre sıfırlama özelliği yapım aşamasında. Bu süreçte iletişim sayfasından yardım talep edebilirsin.",
      },
      {
        q: "Hesabımı nasıl silebilirim?",
        a: "Hesabım › Ayarlar menüsünden KVKK kapsamında veri silme talebi gönderebilirsin. 7 iş günü içinde tüm verilerin silinir.",
      },
      {
        q: "E-posta tercihlerimi nasıl yönetebilirim?",
        a: "Hesabım › Ayarlar bölümünden bülten, kampanya ve sipariş bilgilendirmeleri için tercihlerini ayarlayabilirsin.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
          <HelpCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            Yardım merkezi
          </p>
          <h1 className="font-display text-4xl italic leading-tight sm:text-5xl">
            Sıkça sorulanlar
          </h1>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
        Müşterilerimizden en sık aldığımız soruları kategoriler altında derledik.
        Aradığını bulamazsan{" "}
        <a
          href="/shop/iletisim"
          className="text-[color:var(--color-accent)] underline-offset-4 hover:underline"
        >
          iletişim
        </a>{" "}
        sayfasından yazman yeterli.
      </p>

      <div className="mt-12 space-y-12">
        {FAQS.map((cat) => (
          <section key={cat.category}>
            <h2 className="font-display text-3xl italic">{cat.category}</h2>
            <div className="mt-5 divide-y divide-[color:var(--color-border)] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
              {cat.items.map((it, i) => (
                <details
                  key={i}
                  className="group px-5 py-4 [&_summary]:list-none"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm font-medium">{it.q}</span>
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)] transition group-open:rotate-45 group-open:bg-[color:var(--color-accent)] group-open:text-[color:var(--color-accent-fg)]">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-muted)]">
                    {it.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
