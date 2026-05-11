import { Shield } from "lucide-react";

import { getSettings } from "@/lib/queries/settings";

export const metadata = { title: "Aydınlatma Metni — KVKK" };

export const dynamic = "force-dynamic";

const FALLBACK = `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, veri sorumlusu sıfatıyla ${"{COMPANY}"} tarafından hazırlanmıştır.

1. VERİ SORUMLUSU
Veri sorumlusu: ${"{COMPANY}"}
Adres: ${"{ADDRESS}"}
İletişim: ${"{EMAIL}"} · ${"{PHONE}"}

2. İŞLENEN KİŞİSEL VERİLER
- Kimlik (ad, soyad)
- İletişim (e-posta, telefon, adres)
- Sipariş / fatura bilgileri
- Ödeme işlemine ait teknik veriler (kart bilgileri saklanmaz, ödeme sağlayıcısında tutulur)
- Çerez kayıtları (oturum, tercih, analitik)

3. İŞLEME AMACI
Sipariş süreçlerinin yürütülmesi, fatura düzenleme yükümlülüklerinin yerine getirilmesi, müşteri iletişimi, hukuki yükümlülüklerin (vergi, ticaret) ifası ve hizmet kalitesinin iyileştirilmesi.

4. HUKUKİ SEBEPLER
- Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)
- Hukuki yükümlülük (KVKK m.5/2-ç)
- Meşru menfaat (KVKK m.5/2-f)
- Açık rıza (analitik çerezler için)

5. AKTARIM
Verileriniz; ödeme kuruluşları (iyzico), kargo şirketleri, e-fatura entegratörü ve yetkili kamu kurumlarına, sadece amaçla sınırlı olarak aktarılabilir.

6. SAKLAMA SÜRESİ
Vergi mevzuatı gereği ticari belgeler 10 yıl, müşteri iletişim verileri ilişkinin sona ermesinden itibaren 2 yıl saklanır.

7. HAKLARINIZ (KVKK m.11)
Verilerinize erişme, düzeltme, silme, işlemeye itiraz etme, aktarıldığı üçüncü kişileri öğrenme haklarınız vardır. Talebinizi ${"{DPO}"} adresine iletebilir; ayrıca /data-deletion sayfasından silme talebi oluşturabilirsiniz.`;

export default async function PrivacyPage() {
  const settings = await getSettings();

  const text = (settings.privacyPolicyText ?? FALLBACK)
    .replace(/{COMPANY}/g, settings.companyName ?? "Şirket")
    .replace(/{ADDRESS}/g, settings.address ?? "—")
    .replace(/{EMAIL}/g, settings.email ?? "—")
    .replace(/{PHONE}/g, settings.phone ?? "—")
    .replace(
      /{DPO}/g,
      settings.dpoEmail ?? settings.email ?? "info@example.com",
    );

  const updatedAt = settings.privacyPolicyUpdatedAt ?? settings.updatedAt;

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Aydınlatma Metni
          </h1>
          <p className="text-xs text-[color:var(--color-muted)]">
            6698 sayılı KVKK kapsamında ·{" "}
            {new Date(updatedAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
      </header>

      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-fg)]/85">
        {text}
      </div>
    </article>
  );
}
