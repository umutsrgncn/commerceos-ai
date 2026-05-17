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

    `source_images_b64`: 1-4 PNG/JPEG base64 — Gemini 3 Pro Image
    (image-to-image) ile DOĞRUDAN düzenlenir. Source görselin rengi, deseni,
    formu korunur; sadece arka plan/aydınlatma/kompozisyon studio kalitesine
    çekilir. (Eski sürümde Imagen 4 text-to-image kullanılıyordu; mavi elbise
    yüklenip yeşil dönüyordu çünkü model source'u görmüyordu.)
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
    """Kullanıcı fotoğrafını studio kalitesinde DÜZENLE — source'u referans tut.

    Image-to-image akışı: Gemini 3 Pro Image source görseli direkt visual
    context olarak alır → rengi, deseni, formu korur → sadece arka plan,
    aydınlatma, kompozisyon studio kalitesine çekilir.
    """
    image_bytes_list = [_decode_image(b) for b in req.source_images_b64]
    # Çoklu görsel verilirse ilkini ana referans say
    primary = image_bytes_list[0]

    # 1) Vision analizi → sadece UI'da gösterilecek Türkçe açıklama için
    #    (artık prompt indirection'ı için kullanılmıyor; image-to-image modeli
    #    görseli kendi görüyor). Best-effort — fail ederse boş geç.
    tr_desc = ""
    try:
        tr_desc, _ = await _analyze_with_vision(image_bytes_list)
    except Exception as e:
        log.warning("vision analyze skipped (best-effort): %s", e)

    # 2) Editing instruction — image-to-image için kısa, source-koruyucu
    style_brief = {
        "studio": "soft studio lighting, clean seamless white/light background, e-commerce product photography quality, sharp focus, professional retouching",
        "lifestyle": "natural daylight, lifestyle context, premium e-commerce look, subtle warm tone",
        "minimal": "minimalist solid background (#FAFAFA), centered composition, no shadow halo, gallery-grade product shot",
    }.get(req.style, "soft studio lighting, clean background, e-commerce quality")

    instruction = (
        f"Edit this product photo to studio e-commerce quality. {style_brief}. "
        f"CRITICAL: preserve the EXACT product — colors, fabric, pattern, shape, "
        f"silhouette must remain identical to the source. Only change background, "
        f"lighting, framing. Do NOT change product color or design."
    )
    if req.extra_hint:
        clean = req.extra_hint.strip().replace("\n", " ")
        instruction = f"{instruction} User note: {clean[:200]}"

    # 3) Gemini 3 Pro Image — image-to-image edit, N görsel
    images: list[bytes] = []
    for _ in range(max(1, min(4, req.count))):
        try:
            edited = await imagen.edit_image(
                primary,
                instruction,
                mime_type="image/jpeg",
            )
        except Exception as err:
            log.exception("gemini image edit failed in improve")
            raise HTTPException(
                status_code=502, detail=f"Image edit error: {err}"
            ) from err
        if edited:
            images.append(edited)

    if not images:
        raise HTTPException(
            status_code=422,
            detail=(
                "Görsel güvenlik filtresine takıldı veya boş yanıt geldi. "
                "Fotoğrafı sadeleştirip tekrar dene."
            ),
        )

    return ImproveImageResponse(
        images_b64=[base64.b64encode(b).decode("ascii") for b in images],
        prompt=instruction,
        analyzed_description=tr_desc,
    )
