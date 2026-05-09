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
