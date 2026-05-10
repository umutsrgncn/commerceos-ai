"""Receipt/invoice OCR — Gemini Vision ile fatura/fiş fotoğrafından
tutar, tedarikçi, tarih ve kategori çıkarır.

Web client base64 yollar (JSON-friendly). Gemini multimodal API
ile görsel + metin prompt birlikte gönderilir.
"""

import base64
import binascii
import json
import logging
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from google.genai import types
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm.gemini import _client

log = logging.getLogger(__name__)

router = APIRouter(prefix="/receipt", tags=["receipt"])


OCR_SYSTEM = """Sen bir muhasebe asistanısın. Türkçe yanıt veriyorsun.
Sana bir fiş/fatura fotoğrafı verilecek. Şunları çıkaracaksın:

- amount_minor: toplam tutar KURUŞ olarak (örn 12.34 TL → 1234)
- currency: 'TRY' (varsayılan), 'USD', 'EUR'
- vendor: tedarikçi/firma adı (faturayı kesen)
- date: ISO tarih (YYYY-MM-DD), faturada yoksa null
- description: kısa açıklama (1 cümle, ne için ödenmiş)
- category_guess: BİRİ → RENT|PAYROLL|SHIPPING|MARKETING|SUPPLIES|
  COGS|TAXES|UTILITIES|SOFTWARE|TRAVEL|OTHER
- confidence: 0-100 (görüntü kalitesi + alan netliği)
- notes: opsiyonel, belirsiz/şüpheli alanlar

ÇIKTI: SADECE JSON, başka metin yok, kod blok da yok:
{"amount_minor": 1234, "currency": "TRY", "vendor": "...", "date": "2026-...",
 "description": "...", "category_guess": "...", "confidence": 90, "notes": null}

Görüntü okunamıyorsa veya fatura/fiş değilse:
{"error": "kısa açıklama", "confidence": 0}"""


class OcrRequest(BaseModel):
    image_b64: str = Field(
        ...,
        description="Base64 (data URL prefix opsiyonel, otomatik strip edilir)",
        min_length=100,
        max_length=20_000_000,  # ~15 MB raw
    )
    mime_type: str = Field(default="image/jpeg")


class OcrResponse(BaseModel):
    ok: bool
    amount_minor: Optional[int] = None
    currency: Optional[str] = None
    vendor: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    category_guess: Optional[str] = None
    confidence: int = 0
    notes: Optional[str] = None
    error: Optional[str] = None


def _strip_data_url(b64: str) -> str:
    if b64.startswith("data:"):
        idx = b64.find(",")
        if idx >= 0:
            return b64[idx + 1 :]
    return b64


def _extract_json(text: str) -> Optional[dict]:
    """Try direct json, then strip code fences, then regex first {...} match."""
    text = text.strip()
    # Try direct
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip ```json ... ```
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass
    # First {...} block
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group(0))
        except json.JSONDecodeError:
            pass
    return None


@router.post("/ocr", response_model=OcrResponse)
async def ocr_receipt(req: OcrRequest) -> OcrResponse:
    raw = _strip_data_url(req.image_b64)
    try:
        img_bytes = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    if len(img_bytes) < 1024:
        raise HTTPException(status_code=400, detail="Image too small (<1KB)")
    if len(img_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (>8MB)")

    client = _client()
    config = types.GenerateContentConfig(
        system_instruction=OCR_SYSTEM,
        temperature=0.1,
        # Daha hızlı yanıt için JSON mode (Gemini destekliyor)
        response_mime_type="application/json",
    )

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(data=img_bytes, mime_type=req.mime_type),
                types.Part.from_text(text="Bu fatura/fişten verileri çıkar."),
            ],
        )
    ]

    try:
        response = await client.aio.models.generate_content(
            model=get_settings().gemini_model,
            contents=contents,
            config=config,
        )
    except Exception as exc:
        log.exception("Gemini OCR failed")
        return OcrResponse(ok=False, error=f"AI hatası: {exc}")

    text = response.text or ""
    data = _extract_json(text)

    if not data:
        return OcrResponse(ok=False, error="AI yanıtı parse edilemedi", notes=text[:200])

    if data.get("error"):
        return OcrResponse(
            ok=False,
            error=str(data.get("error")),
            confidence=int(data.get("confidence") or 0),
        )

    # Coerce types defensively
    def safe_int(v) -> Optional[int]:
        if v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    return OcrResponse(
        ok=True,
        amount_minor=safe_int(data.get("amount_minor")),
        currency=data.get("currency") or "TRY",
        vendor=data.get("vendor"),
        date=data.get("date"),
        description=data.get("description"),
        category_guess=data.get("category_guess"),
        confidence=safe_int(data.get("confidence")) or 0,
        notes=data.get("notes"),
    )
