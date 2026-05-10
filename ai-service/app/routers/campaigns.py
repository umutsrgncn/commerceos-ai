"""Dead-stock campaign — yavaş hareket eden ürün için AI kampanya
önerisi (indirim oranı, kod, gerekçe, hedef, beklenen etki).
"""

import json
import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import fetch_rows
from app.llm import gemini

log = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["products"])


CAMPAIGN_SYSTEM = """Sen bir e-ticaret kampanya asistanısın. Türkçe yanıtla.
Sana yavaş hareket eden bir ürünün verisi verilecek. Kâr ve sermaye
yönetimi açısından akıllı bir kampanya önereceksin.

KARAR KRİTERLERİ:
- Mevcut marj fiyat-maliyet farkından hesaplanır
- Hedef: bağlı sermayeyi serbest bırakırken brüt kâr negatife düşmesin
- Ürünün stokta kalan sayısı + son satış hızı kampanya yoğunluğunu belirler
- Sezonsal/sıkışık stok ise %15-25 indirim, gerçekten ölü stok ise %30-50
- Asla fiyat maliyetin altına düşmesin (negatif marj uyarısı)

ÇIKTI: SADECE JSON, başka metin yok:
{
  "suggested_discount_pct": <int, 5-60 arası>,
  "suggested_code": "<TR/EN, 6-15 karakter, büyük harf, KAMPANYA-YAZ-X gibi>",
  "campaign_type": "DISCOUNT_PERCENTAGE",
  "duration_days": <int, 7-30>,
  "min_subtotal_minor": <int kuruş, opsiyonel — 0 ise minimum yok>,
  "target_audience": "<TR kısa, 'tüm müşteriler' | 'sadık müşteriler' | 'yeni müşteriler'>",
  "messaging": "<TR 1 cümle, müşteriye gönderilecek mesaj/slogan>",
  "reasoning": "<TR 2-3 cümle, neden bu indirim ve süre>",
  "expected_outcome": "<TR 1 cümle, kaç adet satış + bağlı sermaye etkisi>",
  "risk_warning": "<TR opsiyonel, marj/imaj risklerine dair>",
  "confidence": <0-100>
}

Maliyet (cost_price) NULL ise:
{"error": "Maliyet bilgisi olmadan kâr odaklı kampanya önerilemez. Önce ürün maliyetini gir."}"""


class CampaignSuggestRequest(BaseModel):
    product_id: str = Field(..., min_length=1, max_length=100)


class CampaignSuggestResponse(BaseModel):
    ok: bool
    product_id: str
    product_name: str | None = None
    suggested_discount_pct: int | None = None
    suggested_code: str | None = None
    campaign_type: str | None = None
    duration_days: int | None = None
    min_subtotal_minor: int | None = None
    target_audience: str | None = None
    messaging: str | None = None
    reasoning: str = ""
    expected_outcome: str = ""
    risk_warning: str | None = None
    confidence: int = 0
    # Bağlam bilgileri (UI için)
    current_price_minor: int | None = None
    cost_price_minor: int | None = None
    current_margin_pct: float | None = None
    new_margin_pct_after_discount: float | None = None
    stock_quantity: int = 0
    sold_last_60d: int = 0
    days_since_last_sale: int | None = None
    error: str | None = None


def _extract_json(text: str) -> Optional[dict]:
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


@router.post("/dead-stock-campaign", response_model=CampaignSuggestResponse)
async def dead_stock_campaign(
    req: CampaignSuggestRequest,
) -> CampaignSuggestResponse:
    pid = req.product_id.replace("'", "''")

    prod_rows = await fetch_rows(
        f"""SELECT p.id, p.name, p.sku, p.price, p."costPrice" AS cost_price,
                  p.status, p.currency,
                  COALESCE(i.quantity, 0) AS stock_qty
            FROM "Product" p
            LEFT JOIN "Inventory" i ON i."productId" = p.id
            WHERE p.id = '{pid}' LIMIT 1""",
        1,
    )
    if not prod_rows:
        raise HTTPException(status_code=404, detail="Product not found")
    p = prod_rows[0]

    sales_rows = await fetch_rows(
        f"""SELECT COALESCE(SUM(oi.quantity), 0) AS qty,
                  COALESCE(SUM(oi.total), 0) AS revenue,
                  MAX(o."createdAt") AS last_sale_date,
                  EXTRACT(DAY FROM NOW() - MAX(o."createdAt"))::int AS days_since
            FROM "OrderItem" oi
            JOIN "Order" o ON o.id = oi."orderId"
            WHERE oi."productId" = '{pid}'
              AND o."createdAt" >= NOW() - INTERVAL '60 days'
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')""",
        1,
    )
    sales = sales_rows[0] if sales_rows else {}

    current_price = int(p["price"])
    cost = p.get("cost_price")
    cost_int: int | None = int(cost) if cost is not None else None
    stock_qty = int(p.get("stock_qty") or 0)
    sold_60d = int(sales.get("qty") or 0)
    days_since = sales.get("days_since")
    days_since_int: int | None = (
        int(days_since) if days_since is not None else None
    )

    current_margin = (
        (current_price - cost_int) / current_price * 100
        if cost_int is not None and current_price > 0
        else None
    )

    if cost_int is None:
        return CampaignSuggestResponse(
            ok=False,
            product_id=str(p["id"]),
            product_name=str(p.get("name") or ""),
            current_price_minor=current_price,
            cost_price_minor=None,
            stock_quantity=stock_qty,
            sold_last_60d=sold_60d,
            days_since_last_sale=days_since_int,
            error=(
                "Maliyet bilgisi (costPrice) eksik. AI kâr odaklı kampanya "
                "önermeden önce ürün maliyetini girmelisin."
            ),
        )

    prompt_lines = [
        f"ÜRÜN: {p.get('name')} (SKU {p.get('sku')})",
        f"MEVCUT FİYAT: {current_price / 100:.2f} TL ({current_price} kuruş)",
        f"MALİYET: {cost_int / 100:.2f} TL ({cost_int} kuruş)",
        (
            f"MEVCUT MARJ: %{current_margin:.1f}"
            if current_margin is not None
            else "MEVCUT MARJ: hesaplanamıyor"
        ),
        f"STOK ADEDİ: {stock_qty}",
        f"BAĞLI SERMAYE: {(stock_qty * cost_int) / 100:.0f} TL",
        f"SON 60 GÜN SATIŞ: {sold_60d} adet",
        (
            f"SON SATIŞ: {days_since_int} gün önce"
            if days_since_int is not None
            else "SON SATIŞ: 60+ gün önce / hiç yok"
        ),
        "",
        "Akıllı bir kampanya öner. JSON döndür.",
    ]
    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(
        prompt, system=CAMPAIGN_SYSTEM, temperature=0.4
    )
    data = _extract_json(text)

    if not data:
        return CampaignSuggestResponse(
            ok=False,
            product_id=str(p["id"]),
            product_name=str(p.get("name") or ""),
            current_price_minor=current_price,
            cost_price_minor=cost_int,
            current_margin_pct=current_margin,
            stock_quantity=stock_qty,
            sold_last_60d=sold_60d,
            days_since_last_sale=days_since_int,
            error="AI yanıtı parse edilemedi",
        )

    if data.get("error"):
        return CampaignSuggestResponse(
            ok=False,
            product_id=str(p["id"]),
            product_name=str(p.get("name") or ""),
            current_price_minor=current_price,
            cost_price_minor=cost_int,
            current_margin_pct=current_margin,
            stock_quantity=stock_qty,
            sold_last_60d=sold_60d,
            days_since_last_sale=days_since_int,
            error=str(data["error"]),
        )

    def safe_int(v) -> int | None:
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    discount_pct = safe_int(data.get("suggested_discount_pct")) or 0
    discount_pct = max(0, min(60, discount_pct))

    # Yeni marj hesapla (indirim sonrası)
    new_margin_after = None
    if cost_int is not None and current_price > 0 and discount_pct > 0:
        new_price = current_price * (100 - discount_pct) / 100
        if new_price > 0:
            new_margin_after = (new_price - cost_int) / new_price * 100

    return CampaignSuggestResponse(
        ok=True,
        product_id=str(p["id"]),
        product_name=str(p.get("name") or ""),
        suggested_discount_pct=discount_pct,
        suggested_code=str(data.get("suggested_code") or ""),
        campaign_type=str(data.get("campaign_type") or "DISCOUNT_PERCENTAGE"),
        duration_days=safe_int(data.get("duration_days")) or 14,
        min_subtotal_minor=safe_int(data.get("min_subtotal_minor")),
        target_audience=data.get("target_audience"),
        messaging=data.get("messaging"),
        reasoning=str(data.get("reasoning") or ""),
        expected_outcome=str(data.get("expected_outcome") or ""),
        risk_warning=data.get("risk_warning"),
        confidence=safe_int(data.get("confidence")) or 70,
        current_price_minor=current_price,
        cost_price_minor=cost_int,
        current_margin_pct=current_margin,
        new_margin_pct_after_discount=new_margin_after,
        stock_quantity=stock_qty,
        sold_last_60d=sold_60d,
        days_since_last_sale=days_since_int,
    )
