"""Customer message draft prompts for the order surface."""

INTENT_GUIDES = {
    "shipped": (
        "Sipariş kargoya verildi. Müşteriye kargo bilgisini, tahmini teslim "
        "süresini ve sorunu olursa nasıl iletişime geçeceğini söyle."
    ),
    "delayed": (
        "Sipariş gecikiyor. Açıkça özür dile, gecikme sebebini kısaca belirt "
        "(spesifik sebep verilmediyse 'beklenmedik bir gecikme'), yeni "
        "tahmini tarih ver veya küçük bir teşekkür/jest öner."
    ),
    "thanks": (
        "Sipariş teslim edildi/tamamlandı. Müşteriye samimi bir teşekkür et, "
        "değerlendirme/feedback davet et."
    ),
    "apology": (
        "Bir hata oldu (yanlış ürün, eksik kalem vb). Sorumluluğu üstlen, "
        "açıkça özür dile, çözüm adımını net söyle."
    ),
    "cancelled": (
        "Sipariş iptal edildi. İade süresini ve nasıl ilerleyeceğini açıkla, "
        "müşterinin kafasında soru bırakma."
    ),
}

SYSTEM_PROMPT = """Sen bir e-ticaret müşteri iletişim editörüsün. Türkçe yazıyorsun.

Görev: Yöneticinin müşteriye gönderebileceği KISA mesajı taslakla.

Kurallar:
- E-posta gibi düşün ama 'Merhaba {ad}' ile başla, '— {firma}' ile bitir.
  Firma adı verilmediyse sadece 'Saygılarımızla' ile bitir.
- 80-150 kelime arası tut. Madde işareti kullanma, akıcı paragraf yaz.
- Sipariş numarasını mutlaka belirt.
- Para tutarı / tarih sana verildiyse onu kullan, UYDURMA.
- Pazarlama dili kullanma (kampanya, fırsat vs.). Bu işlem mesajı.
- Çıktıda sadece mesaj olsun — başlık, etiket, açıklama yok."""


def build_user_prompt(
    *,
    intent: str,
    order_number: str,
    customer_name: str,
    total_label: str | None = None,
    extra_context: str | None = None,
) -> str:
    intent_guide = INTENT_GUIDES.get(intent, INTENT_GUIDES["shipped"])
    parts = [
        f"Niyet: {intent_guide}",
        f"Sipariş numarası: {order_number}",
        f"Müşteri adı: {customer_name}",
    ]
    if total_label:
        parts.append(f"Sipariş tutarı: {total_label}")
    if extra_context:
        parts.append(f"Ek bağlam: {extra_context}")
    parts.append("Mesajı yaz:")
    return "\n".join(parts)
