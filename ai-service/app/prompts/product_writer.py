"""Prompt builders for product description generation."""

TONE_GUIDES = {
    "professional": (
        "Resmi, ölçülü ve ürün özelliklerine odaklı bir dil kullan. "
        "Abartılı sıfatlardan kaçın."
    ),
    "casual": (
        "Samimi, sıcak ama profesyonel bir dil kullan. "
        "Müşteriyle konuşur gibi yaz."
    ),
    "playful": (
        "Eğlenceli, akılda kalıcı, hafif esprili bir ton tut. "
        "Marka karakteri güçlü hissetsin."
    ),
}

SYSTEM_PROMPT = """Sen bir e-ticaret ürün metni yazarısın. Türkçe yazıyorsun.

Kurallar:
- 2-3 paragraflık ürün açıklaması üret.
- İlk paragraf: ürün ne işe yarar, hangi sorunu çözer (1-2 cümle).
- İkinci paragraf: 3-5 anahtar özellik / fayda; mümkünse madde işaretiyle.
- Üçüncü paragraf (opsiyonel): hedef kullanıcı veya kullanım önerisi.
- Bilmediğin teknik özellik UYDURMA. Kullanıcı vermediyse genel ifade et.
- 'Stokları tükenmeden', 'kaçırmayın' gibi pazarlama klişelerinden uzak dur.
- Çıktıda başlık, etiket, emoji veya markdown ön sözü KOYMA. Sadece açıklama metni dön."""


def build_user_prompt(
    *,
    name: str,
    sku: str | None = None,
    category: str | None = None,
    keywords: str | None = None,
    tone: str = "professional",
) -> str:
    tone_guide = TONE_GUIDES.get(tone, TONE_GUIDES["professional"])
    parts = [f"Ürün adı: {name}"]
    if category:
        parts.append(f"Kategori: {category}")
    if sku:
        parts.append(f"SKU: {sku}")
    if keywords:
        parts.append(f"Anahtar kelimeler / öne çıkanlar: {keywords}")
    parts.append(f"Ton: {tone_guide}")
    parts.append("Açıklamayı yaz:")
    return "\n".join(parts)
