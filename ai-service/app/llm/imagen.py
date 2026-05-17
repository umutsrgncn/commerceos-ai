"""Imagen image generation wrapper.

Uses the same google-genai SDK as Gemini text models, so the GEMINI_API_KEY
environment variable (which actually grants access to the entire Google AI
Studio project) is sufficient — no separate Imagen credentials needed.
"""

import logging
from typing import Literal

from google import genai
from google.genai import types

from app.config import get_settings

log = logging.getLogger(__name__)

# Imagen 4 fast variant on AI Studio (Gemini API) — Imagen 3 is no longer
# exposed on the free-tier endpoint. fast vs standard: standard delivers
# slightly more polished output, fast is 2x quicker — pick based on UX needs.
IMAGEN_MODEL = "imagen-4.0-fast-generate-001"

# Gemini 3 Pro Image — image-to-image / image editing model. Source görsel
# direkt visual context olarak girer; rengi, deseni, formu korur. "Fotomu
# iyileştir" gibi referans-zorunlu use case'lerde Imagen text-to-image yerine
# bu kullanılır.
GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview"

AspectRatio = Literal["1:1", "3:4", "4:3", "9:16", "16:9"]


def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


async def generate_images(
    prompt: str,
    *,
    count: int = 1,
    aspect_ratio: AspectRatio = "1:1",
    negative_prompt: str | None = None,
) -> list[bytes]:
    """Returns a list of raw PNG byte arrays.

    Imagen rejects prompts that look like real-person likenesses; we always
    pass DONT_ALLOW for person_generation since admin product shots should
    never need human models.

    Note: Gemini API'nin Imagen endpoint'i `negative_prompt` ve
    `safety_filter_level` parametrelerini kabul etmiyor (sadece Vertex AI
    bunları destekliyor). Negatif kuralları prompt sonunda 'AVOID:' metni
    olarak ekliyoruz, model bunlara saygı duyuyor.
    """
    if negative_prompt:
        prompt = f"{prompt}. AVOID: {negative_prompt}"

    client = _client()
    response = await client.aio.models.generate_images(
        model=IMAGEN_MODEL,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=max(1, min(4, count)),
            aspect_ratio=aspect_ratio,
            person_generation="DONT_ALLOW",
        ),
    )

    out: list[bytes] = []
    for generated in response.generated_images or []:
        if generated.image and generated.image.image_bytes:
            out.append(generated.image.image_bytes)
        elif getattr(generated, "rai_filtered_reason", None):
            log.warning("Imagen safety filter: %s", generated.rai_filtered_reason)

    if not out:
        log.warning(
            "Imagen returned no images. prompt=%r, response=%r",
            prompt,
            response,
        )
    return out


async def edit_image(
    source_image_bytes: bytes,
    instruction: str,
    *,
    mime_type: str = "image/jpeg",
) -> bytes | None:
    """Source görseli **referans alarak** düzenle ve yeni görsel döndür.

    Gemini 3 Pro Image (image-to-image) — kullanıcının yüklediği fotoğrafın
    renk, desen ve formunu koruyarak prompt'taki yönlendirmeyi uygular. Imagen
    text-to-image'in aksine source görseli "görür", bilinmeyen bir konsept
    üretmez.

    Args:
        source_image_bytes: Kullanıcının yüklediği orijinal görsel.
        instruction: Türkçe veya İngilizce yönergeler (ör. "studio lighting,
            white background, e-commerce product shot").
        mime_type: image/jpeg, image/png, image/webp.

    Returns:
        Yeni görsel PNG/JPEG bytes — model güvenlik filtresi engellerse None.
    """
    client = _client()
    parts = [
        types.Part.from_bytes(data=source_image_bytes, mime_type=mime_type),
        types.Part.from_text(text=instruction),
    ]
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_IMAGE_MODEL,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )
    except Exception as err:
        log.exception("Gemini image edit failed")
        raise

    candidates = response.candidates or []
    for cand in candidates:
        if not cand.content or not cand.content.parts:
            continue
        for part in cand.content.parts:
            inline = getattr(part, "inline_data", None)
            if inline and inline.data:
                return inline.data
    log.warning(
        "Gemini image edit returned no image. response=%r",
        response,
    )
    return None
