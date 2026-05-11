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


# ─── 3) Finance insight (structured + charts) ───────────────────────────────

import re
import logging

from pydantic import BaseModel as _BM

log = logging.getLogger(__name__)


INSIGHT_SYSTEM = """Sen DENEYİMLİ, AÇIK SÖZLÜ bir CFO danışmanısın. Türkçe.
Yumuşatma, mağaza sahibine gerçeği söyle.

Sana mağazanın N gün finansal özeti verilecek (gelir, gider, kâr, kategori
bazında gider, hedef). Sen STRUCTURED JSON döneceksin — düz metin YOK,
markdown YOK. Frontend bu JSON'u render edecek.

ÇIKTI: SADECE JSON, başka metin yasak:
{
  "summary": "<2-3 cümle DÜRÜST teşhis. 'Kâr marjınız %X, sektör ortalaması %Y — Z kategorisinde dikkat.'>",
  "key_findings": [
    {
      "title": "<5-9 kelime, kısa ve direkt>",
      "severity": "high" | "medium" | "low",
      "detail": "<1-2 cümle açıklama + tutar/yüzde>"
    }
    // 3-5 finding
  ],
  "actions": [
    {
      "title": "<3-7 kelime, emir kipi. 'X harcamasını yarıya indir'>",
      "description": "<2-3 cümle: ne, kim, ne zaman, beklenen etki>",
      "category": "CUT" | "GROW" | "FIX",
      "impact_minor_monthly": <int kuruş, pozitif etki>,
      "urgency": "high" | "medium" | "low"
    }
    // 3-5 aksiyon
  ],
  "charts": [
    {
      "type": "bar" | "line",
      "title": "<TR>",
      "labels": [<str>, ...],
      "values": [<num>, ...],  // TL (kuruş değil) veya adet/%
      "unit": "₺" | "adet" | "%"
    }
    // 1-3 chart. EN AZ 1: kategori bazında gider bar chart'ı.
  ]
}

KURALLAR:
1. ⚠️ KURUŞ: SQL'den gelen tutarlar kuruş. Chart values'a TL olarak yaz.
   Örnek: 1267000 (kuruş) → 12670 (TL). Frontend ₺ ile gösterir.
2. 🚫 Yasaklı yumuşak diller (Turnaround'daki aynı kurallar):
   "Optimize edilmeli", "gözden geçirilebilir", "değerlendirilmeli" → kullanma.
   Yerine direkt rakam: "X TL'den Y TL'ye düşür".
3. Sayıları UYDURMA — verilen JSON'dan kullan. Kategori bazında gider
   chart'ı zorunlu — verilen by_category dizisini bar olarak çiz.
4. Severity dağılımı: en az 1 high, en az 1 medium veya low.
5. Action category: CUT = gider azalt, GROW = gelir artır, FIX = bug fix
6. impact_minor_monthly KURUŞ — örnek: aylık 12.000 TL tasarruf → 1200000.
7. Eğer kâr marjı %5'in altındaysa summary'de "marjın çok düşük, X kategori
   yiyiciliği" direkt söyle.

İYİ ÖRNEK key_finding:
{"title": "Personel maliyeti gelirin %40'ı", "severity": "high",
 "detail": "Son 30 günde personel 13.686 TL — net gelir 12.929 TL. Bu oran %50+, sürdürülebilir değil."}

KÖTÜ (KULLANMA):
{"title": "Maliyetler yüksek", "severity": "medium", "detail": "Giderlere bakılabilir."}"""


class InsightRequest(BaseModel):
    period_label: str
    revenue_net_minor: int
    expense_total_minor: int
    net_profit_minor: int
    by_category: list[dict]
    goal_target_minor: int | None = None
    goal_progress_pct: float | None = None


class InsightFinding(_BM):
    title: str
    severity: str
    detail: str


class InsightAction(_BM):
    title: str
    description: str
    category: str  # CUT | GROW | FIX
    impact_minor_monthly: int
    urgency: str


class InsightChart(_BM):
    type: str  # bar | line
    title: str
    labels: list[str]
    values: list[float]
    unit: str = "₺"


class InsightResponse(_BM):
    summary: str
    key_findings: list[InsightFinding]
    actions: list[InsightAction]
    charts: list[InsightChart]


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group(0))
        except json.JSONDecodeError:
            pass
    return None


@router.post("/insight", response_model=InsightResponse)
async def finance_insight(req: InsightRequest) -> InsightResponse:
    """Structured JSON: summary + key_findings + actions + charts."""
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
    prompt = f"VERİ:\n{payload}\n\nJSON çıktı ver."

    text = await gemini.generate(
        prompt, system=INSIGHT_SYSTEM, temperature=0.4
    )
    data = _extract_json(text)

    if not data or "summary" not in data:
        log.warning("Insight parse failed, returning fallback")
        # Fallback: minimum yapı, in_categori'den manuel bar oluştur
        bar_labels = [c.get("category", "") for c in req.by_category[:8]]
        bar_values = [
            round(int(c.get("amount") or 0) / 100, 2)
            for c in req.by_category[:8]
        ]
        return InsightResponse(
            summary="AI yanıtı parse edilemedi. Manuel rapor.",
            key_findings=[],
            actions=[],
            charts=[
                InsightChart(
                    type="bar",
                    title="Kategori bazında gider",
                    labels=bar_labels,
                    values=bar_values,
                    unit="₺",
                )
            ],
        )

    findings: list[InsightFinding] = []
    for f in (data.get("key_findings") or [])[:6]:
        try:
            findings.append(
                InsightFinding(
                    title=str(f.get("title", ""))[:200],
                    severity=str(f.get("severity") or "low").lower(),
                    detail=str(f.get("detail", ""))[:400],
                )
            )
        except (ValueError, TypeError):
            continue

    actions: list[InsightAction] = []
    for a in (data.get("actions") or [])[:6]:
        try:
            actions.append(
                InsightAction(
                    title=str(a.get("title", ""))[:200],
                    description=str(a.get("description", ""))[:400],
                    category=str(a.get("category") or "FIX").upper(),
                    impact_minor_monthly=int(a.get("impact_minor_monthly") or 0),
                    urgency=str(a.get("urgency") or "medium").lower(),
                )
            )
        except (ValueError, TypeError):
            continue

    charts: list[InsightChart] = []
    for c in (data.get("charts") or [])[:4]:
        try:
            labels = [str(x) for x in (c.get("labels") or [])]
            vals_raw = c.get("values") or []
            values = [float(v) if isinstance(v, (int, float)) else 0.0 for v in vals_raw]
            if labels and values and len(labels) == len(values):
                charts.append(
                    InsightChart(
                        type=str(c.get("type") or "bar").lower(),
                        title=str(c.get("title", ""))[:120],
                        labels=labels[:20],
                        values=values[:20],
                        unit=str(c.get("unit") or "₺"),
                    )
                )
        except (ValueError, TypeError):
            continue

    # Garantili kategori chart'ı eğer hiç chart yoksa
    if not charts and req.by_category:
        charts.append(
            InsightChart(
                type="bar",
                title="Kategori bazında gider",
                labels=[c.get("category", "") for c in req.by_category[:8]],
                values=[round(int(c.get("amount") or 0) / 100, 2) for c in req.by_category[:8]],
                unit="₺",
            )
        )

    return InsightResponse(
        summary=str(data.get("summary") or ""),
        key_findings=findings,
        actions=actions,
        charts=charts,
    )
