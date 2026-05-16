import base64
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm import imagen
from app.prompts.product_image import (
    PRODUCT_NEGATIVE_PROMPT,
    STYLE_TEMPLATES,
    build_product_image_prompt,
)

router = APIRouter(prefix="/images", tags=["images"])
log = logging.getLogger(__name__)

ProductImageStyle = Literal["studio", "lifestyle", "minimal", "dark"]


class ProductImageRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=80)
    style: ProductImageStyle = "studio"
    count: int = Field(default=1, ge=1, le=4)
    aspect_ratio: Literal["1:1", "3:4", "4:3", "16:9"] = "1:1"


class ProductImageResponse(BaseModel):
    images_b64: list[str]
    prompt: str


@router.post("/product", response_model=ProductImageResponse)
async def generate_product_image(req: ProductImageRequest) -> ProductImageResponse:
    prompt = build_product_image_prompt(
        name=req.name,
        description=req.description,
        category=req.category,
        style=req.style,
    )

    try:
        images = await imagen.generate_images(
            prompt,
            count=req.count,
            aspect_ratio=req.aspect_ratio,
            negative_prompt=PRODUCT_NEGATIVE_PROMPT,
        )
    except Exception as err:  # google.genai surface-level errors
        raise HTTPException(status_code=502, detail=f"Imagen error: {err}") from err

    if not images:
        raise HTTPException(
            status_code=422,
            detail="Imagen güvenlik filtresi tüm sonuçları engelledi. Prompt'u sadeleştir.",
        )

    return ProductImageResponse(
        images_b64=[base64.b64encode(b).decode("ascii") for b in images],
        prompt=prompt,
    )


# ─── Improve from user photo ─────────────────────────────────────────────────


class ImproveImageRequest(BaseModel):
    """Kullanıcının yüklediği fotoğrafları temel alır.

    `source_images_b64`: 1-4 PNG/JPEG base64 — Gemini Vision ile analiz edilir.
    Çıkan ürün açıklamasına göre Imagen 4 studio kalitesinde yeni görseller
    üretir. Kullanıcı yüklediği fotoyu DOĞRUDAN düzeltmiyoruz (Imagen 4 fast
    image-to-image desteklemiyor); referans olarak alıp tek-tek YENİ studio
    görseller üretiyoruz.
    """

    source_images_b64: list[str] = Field(..., min_length=1, max_length=4)
    style: ProductImageStyle = "studio"
    count: int = Field(default=2, ge=1, le=4)
    extra_hint: str | None = Field(default=None, max_length=500)


class ImproveImageResponse(BaseModel):
    images_b64: list[str]
    prompt: str
    analyzed_description: str


VISION_MODEL = "gemini-2.5-pro"

VISION_INSTRUCTION = (
    "Bu kullanıcı yüklediği bir e-ticaret ürün fotoğrafı. Görseli analiz et ve "
    "TAM olarak şu JSON formatında dön, **başka hiçbir metin yok**:\n"
    '{"tr": "<Türkçe ürün açıklaması — 1 cümle, max 25 kelime>", '
    '"en_prompt": "<English Imagen prompt — object-focused, max 60 words, '
    'NO words like person/model/wearing/posed>"}\n\n'
    "Örnek tr: \"Siyah pamuklu tişört, ön göğüste küçük beyaz logo, klasik kesim\"\n"
    "Örnek en_prompt: \"black cotton t-shirt with small white chest logo, classic fit, "
    "soft cotton texture\"\n"
    "Önemli: Yalnızca JSON dön, markdown code fence olmadan."
)


def _decode_image(b64: str) -> bytes:
    """Strip data URL prefix + decode base64 — JS tarafı genelde data:image/* gönderir."""
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    try:
        return base64.b64decode(b64, validate=True)
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Geçersiz görsel: {err}") from err


async def _analyze_with_vision(image_bytes_list: list[bytes]) -> tuple[str, str]:
    """Gemini Vision ile (Türkçe açıklama, İngilizce Imagen promptu) döner."""
    client = genai.Client(api_key=get_settings().gemini_api_key)
    parts: list[types.Part] = [types.Part.from_text(text=VISION_INSTRUCTION)]
    for b in image_bytes_list:
        parts.append(types.Part.from_bytes(data=b, mime_type="image/jpeg"))
    try:
        resp = await client.aio.models.generate_content(
            model=VISION_MODEL,
            contents=[types.Content(role="user", parts=parts)],
        )
    except Exception as err:
        log.exception("vision analyze failed")
        raise HTTPException(
            status_code=502, detail=f"Görsel analizi başarısız: {err}"
        ) from err

    raw = (resp.text or "").strip()
    if not raw:
        raise HTTPException(
            status_code=422, detail="AI yüklenen fotoğraftan açıklama çıkaramadı."
        )

    # JSON parse — markdown fence varsa temizle
    import json
    import re
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
    try:
        data = json.loads(cleaned)
        tr = str(data.get("tr", "")).strip()
        en = str(data.get("en_prompt", "")).strip()
        if not tr or not en:
            raise ValueError("tr/en_prompt eksik")
        return tr, en
    except Exception:
        # JSON dönmediyse: raw'ı her iki yerde kullan (fallback)
        log.warning("vision JSON parse fail, fallback raw=%s", raw[:200])
        return raw, raw


@router.post("/improve", response_model=ImproveImageResponse)
async def improve_image(req: ImproveImageRequest) -> ImproveImageResponse:
    """Kullanıcı fotoğraflarından e-ticaret studio görseli üret."""
    image_bytes = [_decode_image(b) for b in req.source_images_b64]

    # 1) Vision analizi → (TR açıklama UI'a, EN prompt Imagen'e)
    tr_desc, en_prompt = await _analyze_with_vision(image_bytes)

    # 2) Style template'ini sar
    style_template = STYLE_TEMPLATES.get(req.style, STYLE_TEMPLATES["studio"])
    final_prompt = style_template.format(subject=en_prompt.rstrip("."))
    if req.extra_hint:
        clean = req.extra_hint.strip().replace("\n", " ")
        final_prompt = f"{final_prompt}. Note: {clean[:200]}"

    # 3) Imagen 4 — N görsel üret
    try:
        images = await imagen.generate_images(
            final_prompt,
            count=req.count,
            aspect_ratio="1:1",
            negative_prompt=PRODUCT_NEGATIVE_PROMPT,
        )
    except Exception as err:
        log.exception("imagen failed in improve")
        raise HTTPException(status_code=502, detail=f"Imagen error: {err}") from err

    if not images:
        raise HTTPException(
            status_code=422,
            detail="Imagen güvenlik filtresi sonuçları engelledi. Fotoğrafı sadeleştir.",
        )

    return ImproveImageResponse(
        images_b64=[base64.b64encode(b).decode("ascii") for b in images],
        prompt=final_prompt,
        analyzed_description=tr_desc,
    )
