import { ShieldCheck } from "lucide-react";

export const metadata = { title: "KVKK Aydınlatma Metni · Pamuk" };

export default function KvkkPage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            6698 sayılı KVKK
          </p>
          <h1 className="font-display text-4xl italic leading-tight sm:text-5xl">
            Aydınlatma metni
          </h1>
        </div>
      </div>

      <p className="mt-6 text-xs text-[color:var(--color-muted)]">
        Son güncelleme: 1 Şubat 2026
      </p>

      <div className="prose mt-10 max-w-none space-y-8 text-sm leading-relaxed text-[color:var(--color-fg)]/85">
        <section>
          <h2 className="font-display text-2xl italic">1. Veri sorumlusu</h2>
          <p className="mt-3">
            <strong>Pamuk Tekstil A.Ş.</strong> ("Pamuk", "Mağaza", "biz") olarak
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca
            veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan
            kapsamda işlemekteyiz. Bu metin, KVKK'nın 10. maddesi uyarınca
            müşterilerimizi bilgilendirmek amacıyla hazırlanmıştır.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-[color:var(--color-muted)]">
            <li>
              <strong>Adres:</strong> Levent Mah. Atatürk Cad. No: 14, 34330
              Beşiktaş / İstanbul
            </li>
            <li>
              <strong>MERSİS No:</strong> 0123456789012345
            </li>
            <li>
              <strong>E-posta:</strong> kvkk@pamuktekstil.com
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl italic">2. İşlenen veriler</h2>
          <p className="mt-3">
            Sipariş, üyelik ve iletişim süreçlerimizde aşağıdaki kategorilerde
            kişisel verilerinizi işliyoruz:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>
              <strong>Kimlik:</strong> Ad, soyad
            </li>
            <li>
              <strong>İletişim:</strong> E-posta, telefon, teslimat ve fatura
              adresi
            </li>
            <li>
              <strong>Müşteri işlem:</strong> Sipariş geçmişi, ödeme bilgileri
              (kart son 4 hanesi), iade talepleri
            </li>
            <li>
              <strong>Pazarlama:</strong> Bülten tercihi, anket/değerlendirme
              cevapları
            </li>
            <li>
              <strong>Hukuki işlem:</strong> Resmi taleplere yanıtlar
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl italic">3. İşleme amaçları</h2>
          <p className="mt-3">
            Kişisel verileriniz aşağıdaki amaçlar için işlenir:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Sipariş alma, hazırlama, kargoya verme ve teslim etme</li>
            <li>Müşteri hizmetleri ve şikayet yönetimi</li>
            <li>
              Yasal yükümlülüklerin yerine getirilmesi (e-fatura, vergi mevzuatı)
            </li>
            <li>
              Onay verdiğiniz takdirde bülten, kampanya ve yeni ürün bildirimi
            </li>
            <li>
              Mağaza performansını ölçmek için anonim istatistiksel analiz
            </li>
            <li>Hile, sahtekarlık ve siber saldırılara karşı önlem</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl italic">
            4. Verilerin aktarımı
          </h2>
          <p className="mt-3">
            Kişisel verileriniz şu üçüncü taraflarla, sadece amacın gereği
            kadar paylaşılır:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>
              <strong>Kargo firmaları</strong> (Aras, Yurtiçi, MNG, PTT) —
              teslimat adresi ve telefon
            </li>
            <li>
              <strong>Ödeme altyapısı</strong> (iyzico, banka) — ödeme tutarı ve
              referans
            </li>
            <li>
              <strong>E-posta servisi</strong> (Mailchimp, Klaviyo) — sipariş
              onay ve bülten gönderimi
            </li>
            <li>
              <strong>Hosting/altyapı</strong> (Vercel, AWS) — şifreli
              veritabanı barındırma
            </li>
            <li>
              <strong>Yetkili kurumlar</strong> — yasal talep halinde (GİB,
              mahkemeler)
            </li>
          </ul>
          <p className="mt-3">
            Verileriniz Türkiye dışına KVKK'nın 9. maddesindeki güvenceler
            sağlanmadan aktarılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic">5. Saklama süresi</h2>
          <p className="mt-3">
            Verileriniz, ilgili kanunlardaki minimum süreler sonunda anonim hale
            getirilir veya silinir. Örneğin:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Sipariş ve fatura: 10 yıl (VUK)</li>
            <li>Üyelik bilgileri: hesap silinene kadar + 3 yıl arşiv</li>
            <li>Pazarlama izni: izin geri çekilene kadar</li>
            <li>Sunucu logları: 6 ay</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl italic">
            6. Haklarınız (KVKK m. 11)
          </h2>
          <p className="mt-3">
            KVKK'nın 11. maddesi kapsamında veri sorumlusu olarak bize
            başvurarak şu haklarınızı kullanabilirsiniz:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>İşlenen verilerinizi öğrenme</li>
            <li>Kopya talep etme</li>
            <li>Hatalı verinin düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>İşlemeye itiraz etme</li>
            <li>Otomatik analiz sonuçlarına itiraz</li>
            <li>Zararın tazminini talep etme</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.04] p-6">
          <h2 className="flex items-center gap-2 font-display text-xl italic text-[color:var(--color-accent)]">
            <ShieldCheck className="h-5 w-5" />
            Başvuru
          </h2>
          <p className="mt-3 text-sm">
            Haklarınızı kullanmak için: <br />
            <strong>kvkk@pamuktekstil.com</strong> adresine kimlik bilginizle
            birlikte yazılı talep gönderin. <br />
            En geç <strong>30 gün içinde</strong> talebiniz yanıtlanır.
          </p>
          <p className="mt-3 text-xs text-[color:var(--color-muted)]">
            Hesabınız varsa <em>Hesabım › Ayarlar › KVKK</em> bölümünden
            verilerinizin silinmesini doğrudan talep edebilirsiniz.
          </p>
        </section>
      </div>
    </>
  );
}
