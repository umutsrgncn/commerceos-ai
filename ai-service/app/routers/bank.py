"""Banka tx → sipariş eşleştirme endpoint'i.

Kullanıcı bir havale (CSV satırı veya webhook event) verir; bu router DB'den
candidate sipariş listesi çıkarır (tutar ±1₺ tolerans, ±7 gün), Gemini'ye
sunar, en iyi eşleşmeyi confidence ile döner.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db import fetch_rows
from app.llm import gemini

log = logging.getLogger(__name__)

router = APIRouter(prefix="/bank", tags=["bank"])

# Tutar toleransı: 1 TL (100 kuruş). Banka komisyon kesintisi vb. için.
AMOUNT_TOLERANCE_MINOR = 100
# Tarih toleransı: 7 gün (sipariş tarihinden ±7 gün).
DATE_TOLERANCE_DAYS = 7
# AI'ya gönderilecek max candidate sayısı (token tasarrufu).
MAX_CANDIDATES = 8


# ─── Match endpoint ─────────────────────────────────────────────────────────

MATCH_SYSTEM = """Sen bir e-ticaret muhasebe asistanısın. Türkçe yanıtla.
Bir banka havalesinin (gelen ödeme) hangi siparişle eşleştiğini bulacaksın.

GİRDİ formatı:
- Havale: tarih, tutar, açıklama
- Aday siparişler: liste (id, sipariş_no, tarih, tutar, müşteri_adı, müşteri_email, status)

KARAR KURALLARI (sırayla uygula):
1. Açıklamada sipariş numarası varsa (ORD-XXXX, GIB-XXX gibi) → en yüksek öncelik
2. Açıklamada müşteri adı/soyadı varsa → o müşterinin siparişi
3. Tutar ve tarih yakınlığı son çare

ÇIKTI (TAM olarak bu format, başka açıklama yazma):
ORDER_ID: <id veya NONE>
CONFIDENCE: <0-100>
REASONING: <Türkçe 1 cümle, neden bu sipariş>

CONFIDENCE rehberi:
- 95-100: açıklamada sipariş no var, tutar+tarih de uyuyor
- 80-94: açıklamada müşteri adı tam eşleşme + tutar/tarih uyumlu
- 60-79: tutar ve tarih uyuyor ama açıklama belirsiz
- 30-59: zayıf sinyal, manuel onay önerilir
- 0-29: eşleşme bulunamadı (NONE)"""


class BankMatchRequest(BaseModel):
    transaction_date: str = Field(
        ...,
        description="ISO tarih (YYYY-MM-DD veya tam ISO datetime)",
    )
    amount_minor: int = Field(
        ...,
        gt=0,
        description="Pozitif kuruş tutarı (gelen havale)",
    )
    description: str = Field(..., max_length=500)


class CandidateOrder(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    total_minor: int
    status: str
    created_at: str


class BankMatchResponse(BaseModel):
    matched_order_id: Optional[str] = None
    matched_order_number: Optional[str] = None
    confidence: int
    reasoning: str
    candidate_count: int


async def _find_candidates(
    *, amount_minor: int, transaction_date: str
) -> list[CandidateOrder]:
    """Tutar ±1₺ ve tarih ±7 gün içindeki potansiyel siparişleri getir.

    İade/iptal edilmemiş siparişler önce gelir. Banka tx'i de zaten gerçekleşmiş
    (PENDING'den ileri durumda) bir siparişe ait olur — DRAFT/CANCELLED elenir.
    """
    sql = f"""
    SELECT o.id, o."orderNumber" AS order_number,
           c.name AS customer_name, c.email AS customer_email,
           o.total AS total_minor, o.status, o."createdAt" AS created_at
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    LEFT JOIN "BankTransaction" bt
      ON bt."matchedOrderId" = o.id AND bt.status IN ('AUTO_MATCHED','MANUAL_MATCHED')
    WHERE bt.id IS NULL
      AND o.status NOT IN ('CANCELLED', 'REFUNDED')
      AND o.total BETWEEN {amount_minor - AMOUNT_TOLERANCE_MINOR}
                       AND {amount_minor + AMOUNT_TOLERANCE_MINOR}
      AND o."createdAt" BETWEEN
            (TIMESTAMP '{transaction_date}' - INTERVAL '{DATE_TOLERANCE_DAYS} days')
        AND (TIMESTAMP '{transaction_date}' + INTERVAL '1 day')
    ORDER BY o."createdAt" DESC
    LIMIT {MAX_CANDIDATES}
    """
    rows = await fetch_rows(sql, MAX_CANDIDATES)
    return [
        CandidateOrder(
            id=str(r["id"]),
            order_number=str(r["order_number"]),
            customer_name=str(r["customer_name"]),
            customer_email=str(r["customer_email"]),
            total_minor=int(r["total_minor"]),
            status=str(r["status"]),
            created_at=str(r["created_at"]),
        )
        for r in rows
    ]


def _parse_match(text: str) -> tuple[Optional[str], int, str]:
    order_id: Optional[str] = None
    confidence = 0
    reasoning = ""
    for line in text.strip().splitlines():
        upper = line.upper()
        value = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
        if upper.startswith("ORDER_ID"):
            order_id = None if value.upper() in {"NONE", "NULL", ""} else value
        elif upper.startswith("CONFIDENCE"):
            try:
                confidence = int("".join(c for c in value if c.isdigit()))
            except ValueError:
                confidence = 0
        elif upper.startswith("REASONING"):
            reasoning = value
    return order_id, max(0, min(100, confidence)), reasoning


@router.post("/match", response_model=BankMatchResponse)
async def match_bank_transaction(req: BankMatchRequest) -> BankMatchResponse:
    candidates = await _find_candidates(
        amount_minor=req.amount_minor,
        transaction_date=req.transaction_date,
    )

    if not candidates:
        return BankMatchResponse(
            matched_order_id=None,
            matched_order_number=None,
            confidence=0,
            reasoning="Bu tutar ve tarihte bekleyen sipariş bulunamadı.",
            candidate_count=0,
        )

    # Tek aday + açıklamada sipariş no varsa kısa-yol — Gemini'yi atla
    if len(candidates) == 1:
        c = candidates[0]
        desc_upper = req.description.upper()
        order_num_upper = c.order_number.upper()
        if order_num_upper in desc_upper:
            return BankMatchResponse(
                matched_order_id=c.id,
                matched_order_number=c.order_number,
                confidence=98,
                reasoning=f"Açıklamada sipariş no {c.order_number} geçiyor ve tek aday var.",
                candidate_count=1,
            )

    # Gemini'ye sor
    prompt_lines = [
        f"HAVALE TARİH: {req.transaction_date}",
        f"HAVALE TUTAR: {req.amount_minor / 100:.2f} TL",
        f"HAVALE AÇIKLAMA: {req.description}",
        "",
        f"ADAY SIPARIŞLER ({len(candidates)} adet):",
    ]
    for c in candidates:
        prompt_lines.append(
            f"- id={c.id} | {c.order_number} | "
            f"{c.total_minor / 100:.2f} TL | "
            f"{c.created_at[:10]} | "
            f"müşteri: {c.customer_name} ({c.customer_email}) | "
            f"durum: {c.status}"
        )
    prompt = "\n".join(prompt_lines) + "\n\nEn iyi eşleşmeyi seç."

    text = await gemini.generate(prompt, system=MATCH_SYSTEM, temperature=0.1)
    order_id, confidence, reasoning = _parse_match(text)

    # Eğer Gemini geçersiz id döndürdüyse (candidate'larda yoksa) → NONE
    matched: Optional[CandidateOrder] = None
    if order_id:
        for c in candidates:
            if c.id == order_id:
                matched = c
                break
        if matched is None:
            log.warning(
                "Gemini returned unknown order id %s, ignoring", order_id
            )
            order_id = None
            confidence = min(confidence, 30)
            reasoning = f"AI geçersiz sipariş id döndürdü, manuel kontrol gerekli. ({reasoning})"

    return BankMatchResponse(
        matched_order_id=order_id,
        matched_order_number=matched.order_number if matched else None,
        confidence=confidence,
        reasoning=reasoning or "AI yanıtı parse edilemedi.",
        candidate_count=len(candidates),
    )
