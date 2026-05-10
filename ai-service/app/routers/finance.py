"""Finansal AI endpoint'leri: gider kategorileme, indirim öneri, finance insight."""

import json
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini

router = APIRouter(prefix="/finance", tags=["finance"])


# ─── 1) Gider kategorileme ──────────────────────────────────────────────────

CATEGORIZE_SYSTEM = """Sen bir muhasebe asistanısın. Türkçe yazıyorsun.
Sana e-ticaret mağazasının bir gider açıklaması verilecek; bu giderin
hangi kategoriye ait olduğunu söyleyeceksin.

Kategoriler (TAM olarak şu değerleri kullan):
- RENT (Kira)
- PAYROLL (Personel/maaş)
- SHIPPING (Kargo, kurye)
- MARKETING (Reklam, sponsorluk, içerik)
- SUPPLIES (Ofis/malzeme, kırtasiye)
- COGS (Satılan mal maliyeti, üretim hammaddesi)
- TAXES (Vergi, SGK, muhtasar)
- UTILITIES (Elektrik, su, doğalgaz, internet, telefon)
- SOFTWARE (Yazılım, SaaS, abonelik)
- TRAVEL (Seyahat, konaklama)
- OTHER (Diğer)

Çıktı (TAM olarak):
CATEGORY: <enum_value>
CONFIDENCE: <0-100>
REASONING: <1 cümle>"""


class CategorizeRequest(BaseModel):
    description: str = Field(..., min_length=2, max_length=500)
    vendor: str | None = Field(default=None, max_length=160)


class CategorizeResponse(BaseModel):
    category: str
    confidence: int
    reasoning: str


def _parse_category(text: str) -> CategorizeResponse:
    category = "OTHER"
    confidence = 0
    reasoning = ""
    for line in text.strip().splitlines():
        upper = line.upper()
        value = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
        if upper.startswith("CATEGORY"):
            category = value.upper()
        elif upper.startswith("CONFIDENCE"):
            try:
                confidence = int("".join(c for c in value if c.isdigit()))
            except ValueError:
                confidence = 0
        elif upper.startswith("REASONING"):
            reasoning = value
    return CategorizeResponse(
        category=category,
        confidence=max(0, min(100, confidence)),
        reasoning=reasoning,
    )


@router.post("/expense/categorize", response_model=CategorizeResponse)
async def categorize_expense(req: CategorizeRequest) -> CategorizeResponse:
    parts = [f"Açıklama: {req.description}"]
    if req.vendor:
        parts.append(f"Tedarikçi: {req.vendor}")
    prompt = "\n".join(parts) + "\n\nKategoriyi belirle."
    text = await gemini.generate(
        prompt,
        system=CATEGORIZE_SYSTEM,
        temperature=0.2,
    )
    return _parse_category(text)


# ─── 2) İndirim önerme ──────────────────────────────────────────────────────

DISCOUNT_SYSTEM = """Sen bir e-ticaret pazarlama danışmanısın. Türkçe yazıyorsun.

Yöneticiye, mağazanın geçmiş satış verilerine ve dönemine bakarak akılda
kalıcı bir indirim kodu öner.

Çıktı (TAM olarak şu yapıda, başka metin YOK):
CODE: <BÜYÜK harfle, 4-12 karakter, anlamlı/akılda kalıcı, sadece A-Z 0-9 ve tire>
TYPE: <PERCENTAGE veya FIXED>
VALUE: <PERCENTAGE ise 0-100 arası tam sayı; FIXED ise kuruş cinsinden integer>
MIN_SUBTOTAL: <kuruş cinsinden minimum sepet eşiği, 0 = yok>
DAYS: <kaç gün geçerli>
DESCRIPTION: <kısa Türkçe açıklama, 1 cümle>
REASONING: <neden bu öneri, 1-2 cümle>

Kurallar:
- Kod İngilizce kelime + sayı veya Türkçe akronim olabilir (örn. SUMMER25,
  TSHIRT15, BAYRAM10).
- PERCENTAGE oranları %5'ten az olmamalı, %50'den fazla olmazsa daha iyi.
- FIXED indirimleri ortalama sepet tutarının %5-15'i kadar olabilir.
- Min subtotal yüksek değer için indirim mantıklı (sepet doldurma stratejisi).
- DAYS 7-30 arası realistik."""


class DiscountSuggestRequest(BaseModel):
    avg_basket_minor: int = Field(..., ge=0)
    monthly_revenue_minor: int = Field(..., ge=0)
    top_categories: list[str] = Field(default_factory=list)
    season: Literal["normal", "summer", "winter", "ramadan", "back_to_school"] = "normal"
    intent: Literal[
        "boost_sales",  # ciroyu canlandır
        "clear_inventory",  # stoğu erit
        "loyalty",  # sadakat
        "new_customer",  # yeni müşteri
    ] = "boost_sales"


class DiscountSuggestResponse(BaseModel):
    code: str
    type: str
    value: int
    min_subtotal: int
    days: int
    description: str
    reasoning: str


def _parse_discount(text: str) -> DiscountSuggestResponse:
    code = "SAMPLE10"
    discount_type = "PERCENTAGE"
    value = 10
    min_subtotal = 0
    days = 14
    description = ""
    reasoning = ""

    for line in text.strip().splitlines():
        upper = line.upper()
        v = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
        if upper.startswith("CODE"):
            code = v.upper().replace(" ", "")[:40]
        elif upper.startswith("TYPE"):
            discount_type = "FIXED" if "FIXED" in v.upper() else "PERCENTAGE"
        elif upper.startswith("VALUE"):
            try:
                value = int("".join(c for c in v if c.isdigit()))
            except ValueError:
                value = 10
        elif upper.startswith("MIN_SUBTOTAL"):
            try:
                min_subtotal = int("".join(c for c in v if c.isdigit()))
            except ValueError:
                min_subtotal = 0
        elif upper.startswith("DAYS"):
            try:
                days = int("".join(c for c in v if c.isdigit()))
            except ValueError:
                days = 14
        elif upper.startswith("DESCRIPTION"):
            description = v
        elif upper.startswith("REASONING"):
            reasoning = v

    return DiscountSuggestResponse(
        code=code,
        type=discount_type,
        value=max(1, value),
        min_subtotal=max(0, min_subtotal),
        days=max(1, min(60, days)),
        description=description,
        reasoning=reasoning,
    )


@router.post("/discount/suggest", response_model=DiscountSuggestResponse)
async def suggest_discount(req: DiscountSuggestRequest) -> DiscountSuggestResponse:
    payload = json.dumps(
        {
            "avg_basket_minor": req.avg_basket_minor,
            "monthly_revenue_minor": req.monthly_revenue_minor,
            "top_categories": req.top_categories,
            "season": req.season,
            "intent": req.intent,
        },
        ensure_ascii=False,
    )
    prompt = (
        f"Mağaza durumu (JSON):\n{payload}\n\n"
        f"Niyet: {req.intent}, sezon: {req.season}.\n"
        "Format'ı bozmadan CODE/TYPE/VALUE/MIN_SUBTOTAL/DAYS/DESCRIPTION/REASONING yaz."
    )
    text = await gemini.generate(
        prompt,
        system=DISCOUNT_SYSTEM,
        temperature=0.7,
    )
    return _parse_discount(text)


# ─── 3) Finance insight (anomali + öneri) ───────────────────────────────────

INSIGHT_SYSTEM = """Sen bir e-ticaret CFO danışmanısın. Türkçe yazıyorsun.

Sana mağazanın son N gün finansal verisi verilecek (gelir, gider, kâr,
kategori bazında gider, hedef vs gerçekleşen). Yöneticiye 3-5 maddelik
aksiyon listesi çıkar.

Kurallar:
- Her madde 1-2 cümle: önce gözlem, sonra somut öneri.
- Sayıları kullan ama UYDURMA — verilen JSON'daki sayılarla kal.
- Para tutarları kuruş cinsinden gelir; cevabında 100'e böl ve TR locale
  ile yaz: '1.234,50 ₺'.
- 'Aksiyon alın hemen' gibi pazarlama klişelerinden kaçın.
- Madde işareti (•) kullan, başka başlık yok."""


class InsightRequest(BaseModel):
    period_label: str
    revenue_net_minor: int
    expense_total_minor: int
    net_profit_minor: int
    by_category: list[dict]
    goal_target_minor: int | None = None
    goal_progress_pct: float | None = None


@router.post("/insight/stream")
async def finance_insight_stream(req: InsightRequest):
    """Streaming değil tekil response — InsightResponse string olarak."""
    from fastapi.responses import StreamingResponse

    payload = json.dumps(
        {
            "period_label": req.period_label,
            "revenue_net_minor": req.revenue_net_minor,
            "expense_total_minor": req.expense_total_minor,
            "net_profit_minor": req.net_profit_minor,
            "by_category": req.by_category,
            "goal": (
                {
                    "target_minor": req.goal_target_minor,
                    "progress_pct": req.goal_progress_pct,
                }
                if req.goal_target_minor
                else None
            ),
        },
        ensure_ascii=False,
        indent=2,
    )
    prompt = (
        f"Veri:\n{payload}\n\n"
        "Aksiyon önerilerini yaz. Madde madde, • ile."
    )

    async def gen():
        async for chunk in gemini.stream_chat(
            prompt, system=INSIGHT_SYSTEM, temperature=0.4
        ):
            yield chunk

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")
