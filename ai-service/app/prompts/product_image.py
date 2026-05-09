"""Prompt builder for Imagen product photography.

Imagen 4'ün AI Studio (Gemini API) safety filter'ı Imagen 3'ten çok daha
agresif. İnsan vücudunu ima eden ifadeler — 'slim fit', 'worn', 'on a
model' gibi — person_generation=DONT_ALLOW ile çakışıp filter'ı tetikliyor.
Bu yüzden prompt'u nesne-merkezli tutuyoruz, 'flat lay / on table' tarzı
sahnelemeler tercih ediyoruz.
"""

# Imagen Gemini API üzerinden negative_prompt parametresi kabul etmiyor.
# Daha önce 'AVOID:' inline metni eklemiştik ama o da safety filter'ı
# tetikliyordu — pozitif yönlendirmeyle ve person_generation=DONT_ALLOW
# config'i ile yetiniyoruz.
PRODUCT_NEGATIVE_PROMPT: str | None = None

STYLE_TEMPLATES: dict[str, str] = {
    "studio": (
        "studio product photograph of {subject} laid flat on a clean white "
        "background, soft diffused lighting, sharp focus, centered, "
        "professional e-commerce catalog shot"
    ),
    "lifestyle": (
        "product photograph of {subject} placed on a wooden surface with "
        "soft natural daylight, tasteful neutral surroundings, no people, "
        "magazine quality"
    ),
    "minimal": (
        "minimal product photograph of {subject} on a soft pastel background, "
        "subtle drop shadow, plenty of negative space, premium feel"
    ),
    "dark": (
        "product photograph of {subject} on a dark gradient background, "
        "rim lighting, dramatic but tasteful, premium luxury aesthetic"
    ),
}


def build_product_image_prompt(
    *,
    name: str,
    description: str | None = None,
    category: str | None = None,
    style: str = "studio",
) -> str:
    """Build a focused product photography prompt.

    Description metni kısaltılır — Imagen uzun pazarlama dilinde değil
    nesne-odaklı kısa ifadelerde daha iyi çalışıyor.
    """
    template = STYLE_TEMPLATES.get(style, STYLE_TEMPLATES["studio"])

    subject_parts: list[str] = [name]
    if category:
        subject_parts.append(f"({category})")
    subject = " ".join(subject_parts)

    prompt = template.format(subject=subject)

    if description:
        compact = description.strip().replace("\n", " ")
        if len(compact) > 200:
            compact = compact[:200].rsplit(" ", 1)[0]
        prompt = f"{prompt}. Material and color: {compact}"

    return prompt
