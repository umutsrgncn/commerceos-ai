from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.segmentation import (
    SYSTEM_PROMPT,
    build_segmentation_prompt,
)

router = APIRouter(prefix="/customers", tags=["customers"])


class SegmentRequest(BaseModel):
    stats: dict[str, Any] = Field(..., description="Aggregated customer profile.")


class SegmentResponse(BaseModel):
    segment: str
    rationale: str
    action: str
    raw: str


def _parse(text: str) -> SegmentResponse:
    """Best-effort parser for the SEGMENT/GEREKÇE/AKSİYON shape."""
    segment = rationale = action = ""
    for line in text.strip().splitlines():
        upper = line.upper()
        if upper.startswith("SEGMENT"):
            segment = line.split(":", 1)[-1].strip()
        elif upper.startswith("GEREKÇE") or upper.startswith("GEREKCE"):
            rationale = line.split(":", 1)[-1].strip()
        elif upper.startswith("AKSİYON") or upper.startswith("AKSIYON"):
            action = line.split(":", 1)[-1].strip()
    return SegmentResponse(
        segment=segment or "Bilinmiyor",
        rationale=rationale,
        action=action,
        raw=text.strip(),
    )


@router.post("/segment", response_model=SegmentResponse)
async def segment(req: SegmentRequest) -> SegmentResponse:
    prompt = build_segmentation_prompt(req.stats)
    text = await gemini.generate(
        prompt,
        system=SYSTEM_PROMPT,
        temperature=0.3,
    )
    return _parse(text)


# ─── Otopilot için by-id varyantı ───────────────────────────────────────────


class SegmentByIdRequest(BaseModel):
    customer_id: str = Field(..., min_length=1, max_length=100)


class SegmentByIdResponse(BaseModel):
    segment: str
    confidence: int
    reasoning: str
    actions: list[str] = []


@router.post("/segment-by-id", response_model=SegmentByIdResponse)
async def segment_by_id(
    req: SegmentByIdRequest,
) -> SegmentByIdResponse:
    """Müşteri ID'si verir, biz DB'den stats topluyoruz, AI segment dönüyoruz."""
    from app.db import fetch_rows

    cid = req.customer_id.replace("'", "''")
    rows = await fetch_rows(
        f"""SELECT
              c.name, c.email,
              COUNT(o.id) AS order_count,
              COALESCE(SUM(o.total), 0) AS total_spend,
              COALESCE(AVG(o.total), 0) AS avg_basket,
              MIN(o."createdAt") AS first_order,
              MAX(o."createdAt") AS last_order
            FROM "Customer" c
            LEFT JOIN "Order" o ON o."customerId" = c.id
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            WHERE c.id = '{cid}'
            GROUP BY c.id LIMIT 1""",
        1,
    )
    if not rows:
        return SegmentByIdResponse(
            segment="yeni",
            confidence=50,
            reasoning="Müşteri DB'de yok, default segment.",
        )

    s = rows[0]
    order_count = int(s.get("order_count") or 0)
    total_spend_minor = int(s.get("total_spend") or 0)
    avg_basket_minor = int(s.get("avg_basket") or 0)

    # Heuristik tabanlı (AI çağrısı yapmadan, çünkü ön bilgi yeterli)
    segment = "yeni"
    confidence = 80
    reasoning = ""
    actions: list[str] = []

    if order_count == 0:
        segment = "yeni"
        reasoning = "Henüz sipariş yok, yeni müşteri."
        actions = ["İlk sipariş indirimi gönder", "Hoş geldin maili"]
        confidence = 95
    elif order_count >= 5 and total_spend_minor >= 500_000:  # ≥5000 TL
        segment = "VIP"
        reasoning = (
            f"{order_count} sipariş ve {total_spend_minor / 100:.0f} TL toplam — VIP."
        )
        actions = ["Loyalty program", "Özel kampanya kodu"]
        confidence = 92
    elif order_count >= 2:
        segment = "sadık"
        reasoning = f"{order_count} sipariş geçmişi var."
        actions = ["Loyalty program", "Çapraz satış"]
        confidence = 85
    else:
        segment = "yeni"
        reasoning = "1 sipariş veya az aktivite."
        actions = ["Tekrar sipariş indirimi"]
        confidence = 75

    return SegmentByIdResponse(
        segment=segment,
        confidence=confidence,
        reasoning=reasoning,
        actions=actions,
    )
