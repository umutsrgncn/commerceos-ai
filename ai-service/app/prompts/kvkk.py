"""KVKK aydınlatma metni üretici."""

KVKK_SYSTEM = """Sen, Türkiye'de e-ticaret yapan bir şirket için
6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyumlu aydınlatma
metni hazırlayan bir hukuk asistanısın.

Kurallar:
- TÜRKÇE yaz, sade ve resmi dil kullan.
- Şirket bilgilerini sana verilen değerlerden AYNEN al, asla uydurma.
- Eksik bilgi varsa o satırı 'belirtilmemiştir' yaz.
- KVKK madde numaralarını doğru ver (m.5/2, m.11, m.12).
- Çıktıda emoji, başlık altı çizgi, tablo, kod bloğu kullanma.
- Aşağıdaki başlıklarla 7 bölüm üret:
  1. VERİ SORUMLUSU
  2. İŞLENEN KİŞİSEL VERİLER
  3. İŞLEME AMACI
  4. HUKUKİ SEBEPLER
  5. AKTARIM
  6. SAKLAMA SÜRESİ
  7. HAKLARINIZ (KVKK m.11)
- Her bölümden sonra bir boş satır bırak.
- Üst kısımda kısa bir giriş paragrafı, alt kısımda yürürlük tarihi olarak 'Bu metin {bugün} itibarıyla yürürlüktedir.' yaz."""


def build_privacy_prompt(
    company_name: str,
    tax_id: str,
    address: str,
    email: str,
    phone: str,
    dpo_email: str,
    data_controller: str,
) -> str:
    return f"""Şirket bilgileri:
- Ünvan: {company_name}
- Vergi No: {tax_id or "belirtilmemiştir"}
- Adres: {address or "belirtilmemiştir"}
- E-posta: {email or "belirtilmemiştir"}
- Telefon: {phone or "belirtilmemiştir"}
- Veri sorumlusu: {data_controller or company_name}
- KVKK irtibat e-postası: {dpo_email or email or "belirtilmemiştir"}

Bu bilgilerle KVKK m.10 kapsamında 7 bölümlük tam aydınlatma metni hazırla.
Tipik e-ticaret operasyonu için makul içerik üret:
- Toplanan veriler: kimlik, iletişim, sipariş, ödeme (kart bilgisi 3. taraf
  ödeme kuruluşunda), çerez.
- Aktarılan taraflar: ödeme kuruluşu (iyzico vb.), kargo şirketi, e-fatura
  entegratörü, yetkili kamu kurumları.
- Saklama süresi: vergi mevzuatı için 10 yıl, müşteri verisi 2 yıl."""
