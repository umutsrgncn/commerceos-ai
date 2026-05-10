"""AI Pricing / Margin Optimizer.

Verilen ürün için maliyet + mevcut fiyat + son 30 gün satış hızı bilgisini
DB'den çekip Gemini'ye sunar. AI önerisi: yeni fiyat (kuruş) + öngörülen
marj + satış etkisi tahmini + reasoning.
"""

import json
import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import fetch_rows
from app.llm import gemini

log = logging.getLogger(__name__)
router = APIRouter(prefix="/pricing", tags=["pricing"])


PRICING_SYSTEM = """Sen bir e-ticaret pazarlama + finansal analiz asistanısın.
Türkçe yanıt veriyorsun. Sana bir ürünün maliyet/fiyat/satış verisi verilecek;
sen kâr maksimize eden yeni fiyatı önereceksin.

KARAR KRİTERLERİ:
- Hedef: brüt kâr (revenue - cost) maksimize
- Mevcut marj çok düşükse (%15 altı) fiyat artırılabilir
- Mevcut marj iyi (%30+) ama satış hızı yüksekse (premium kalan): test fiyat
  artışı (+%5-10) ya da pazar payı için fiyat sabit
- Mevcut marj iyi ama satış hızı düşük: fiyat düşürme + reklam
- AI bilim/numeroloji yok: tahminler 'rough' tutulmalı, kesinlik %0-15

ÇIKTI: SADECE JSON, başka metin yok:
{
  "suggested_price_minor": <int kuruş>,
  "suggested_margin_pct": <float yüzde, ondalıklı>,
  "current_margin_pct": <float yüzde>,
  "expected_sales_change_pct": <float, +/- %, satış etkisi tahmini>,
  "expected_profit_change_pct": <float, +/- %, brüt kâr etkisi tahmini>,
  "confidence": <0-100>,
  "reasoning": "<2-3 cümle TR, neden bu fiyat>",
  "action": "increase|decrease|hold"
}

Confidence düşük olabilir (data az, küçük örnek). Dürüst ol."""


class PriceSuggestRequest(BaseModel):
    product_id: str = Field(..., min_length=1, max_length=100)


class PriceSuggestResponse(BaseModel):
    ok: bool
    product_id: str
    product_name: str | None = None
    current_price_minor: int
    cost_price_minor: int | None
    suggested_price_minor: int | None = None
    suggested_margin_pct: float | None = None
    current_margin_pct: float | None = None
    expected_sales_change_pct: float | None = None
    expected_profit_change_pct: float | None = None
    confidence: int = 0
    reasoning: str = ""
    action: str = "hold"
    sales_30d: int = 0
    revenue_30d_minor: int = 0
    error: str | None = None


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


@router.post("/suggest", response_model=PriceSuggestResponse)
async def suggest_price(req: PriceSuggestRequest) -> PriceSuggestResponse:
    pid = req.product_id.replace("'", "''")
    prod_rows = await fetch_rows(
        f"""SELECT id, name, sku, price, "costPrice" AS cost_price,
                  status, currency
            FROM "Product" WHERE id = '{pid}' LIMIT 1""",
        1,
    )
    if not prod_rows:
        raise HTTPException(status_code=404, detail="Product not found")
    p = prod_rows[0]

    sales_rows = await fetch_rows(
        f"""SELECT COALESCE(SUM(oi.quantity), 0) AS qty,
                  COALESCE(SUM(oi.total), 0) AS revenue,
                  COUNT(DISTINCT o.id) AS order_count
            FROM "OrderItem" oi
            JOIN "Order" o ON o.id = oi."orderId"
            WHERE oi."productId" = '{pid}'
              AND o."createdAt" >= NOW() - INTERVAL '30 days'
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')""",
        1,
    )
    sales = sales_rows[0] if sales_rows else {"qty": 0, "revenue": 0, "order_count": 0}

    current_price = int(p["price"])
    cost = p.get("cost_price")
    cost_int: int | None = int(cost) if cost is not None else None
    current_margin = (
        (current_price - cost_int) / current_price * 100
        if cost_int is not None and current_price > 0
        else None
    )

    if cost_int is None:
        return PriceSuggestResponse(
            ok=False,
            product_id=str(p["id"]),
            product_name=str(p.get("name") or ""),
            current_price_minor=current_price,
            cost_price_minor=None,
            error=(
                "Maliyet (costPrice) tanımlı değil. AI fiyat önerisi için "
                "ürün detayında maliyet girilmesi gerekir."
            ),
        )

    sales_qty = int(sales.get("qty") or 0)
    sales_revenue = int(sales.get("revenue") or 0)

    prompt_lines = [
        f"ÜRÜN: {p.get('name')} (SKU {p.get('sku')})",
        f"DURUM: {p.get('status')}",
        f"MEVCUT FİYAT: {current_price / 100:.2f} TL ({current_price} kuruş)",
        f"MALİYET: {cost_int / 100:.2f} TL",
        (
            f"MEVCUT MARJ: %{current_margin:.1f}"
            if current_margin is not None
            else "MEVCUT MARJ: hesaplanamıyor"
        ),
        "",
        f"SON 30 GÜN SATIŞ: {sales_qty} adet",
        f"SON 30 GÜN GELİR: {sales_revenue / 100:.0f} TL",
        f"SON 30 GÜN SİPARİŞ: {sales.get('order_count', 0)}",
        "",
        "Yeni fiyat öner. Tutar KURUŞ olarak. JSON ile dön.",
    ]
    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(prompt, system=PRICING_SYSTEM, temperature=0.2)
    data = _extract_json(text)

    if not data:
        return PriceSuggestResponse(
            ok=False,
            product_id=str(p["id"]),
            product_name=str(p.get("name") or ""),
            current_price_minor=current_price,
            cost_price_minor=cost_int,
            current_margin_pct=current_margin,
            sales_30d=sales_qty,
            revenue_30d_minor=sales_revenue,
            error="AI yanıtı parse edilemedi",
        )

    suggested_price = data.get("suggested_price_minor")
    try:
        suggested_price = int(suggested_price) if suggested_price is not None else None
    except (TypeError, ValueError):
        suggested_price = None

    def safe_float(v) -> float | None:
        if v is None:
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    return PriceSuggestResponse(
        ok=True,
        product_id=str(p["id"]),
        product_name=str(p.get("name") or ""),
        current_price_minor=current_price,
        cost_price_minor=cost_int,
        suggested_price_minor=suggested_price,
        suggested_margin_pct=safe_float(data.get("suggested_margin_pct")),
        current_margin_pct=current_margin,
        expected_sales_change_pct=safe_float(data.get("expected_sales_change_pct")),
        expected_profit_change_pct=safe_float(data.get("expected_profit_change_pct")),
        confidence=int(data.get("confidence") or 0),
        reasoning=str(data.get("reasoning") or ""),
        action=str(data.get("action") or "hold").lower(),
        sales_30d=sales_qty,
        revenue_30d_minor=sales_revenue,
    )
