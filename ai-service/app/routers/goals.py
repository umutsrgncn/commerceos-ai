"""Sales goal öneri endpoint'i.

Geçmiş aylık ciroya bakıp realistik bir hedef önerir + sayıyı nasıl
hesapladığını kısa açıklar.
"""

import json
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini

router = APIRouter(prefix="/goals", tags=["goals"])


SYSTEM_PROMPT = """Sen e-ticaret yöneticisinin gelecek ay için satış hedefini
belirlemesine yardım eden bir analiz asistanısın. Türkçe yazıyorsun.

Sana verilecek olan: son 6 ayın aylık ciroları (kuruş cinsinden) ve hedef
agresifliği (konservatif / dengeli / agresif).

Görev: Önümüzdeki ay için TEK BİR hedef rakam öner.

Kurallar:
- Konservatif: son 3 ayın ortalaması × 1.0
- Dengeli: son 3 ayın ortalaması × 1.10 (büyüme katkılı)
- Agresif: son 3 ayın ortalaması × 1.25 (genişleme)
- Eğer son 3 ay büyüme trendi varsa katsayıyı bir miktar artır.
- Eğer mevsimsel düşüş varsa hedefi aşırı büyütme.
- Hedef en yakın 1.000 TL'ye yuvarla (yani target_minor 100.000'in
  katlarına yuvarlanır).

Çıktı formatı (TAM olarak şu yapıda):
TARGET: <integer kuruş>
AMBITION: <konservatif|dengeli|agresif>
REASONING: <1-2 cümle, hangi sayıları kullandığını ve katsayıyı belirt>"""


class HistoryItem(BaseModel):
    period: str
    revenue_minor: int


class SuggestRequest(BaseModel):
    history: list[HistoryItem] = Field(..., min_length=1, max_length=12)
    ambition: Literal["konservatif", "dengeli", "agresif"] = "dengeli"


class SuggestResponse(BaseModel):
    target_minor: int
    ambition: str
    reasoning: str


def _parse(text: str, fallback: str) -> SuggestResponse:
    target = 0
    ambition = fallback
    reasoning = ""

    for line in text.strip().splitlines():
        upper = line.upper()
        value = line.split(":", 1)[-1].strip() if ":" in line else line.strip()
        if upper.startswith("TARGET"):
            try:
                target = int("".join(c for c in value if c.isdigit()))
            except ValueError:
                target = 0
        elif upper.startswith("AMBITION"):
            ambition = value.lower() or fallback
        elif upper.startswith("REASONING"):
            reasoning = value

    return SuggestResponse(
        target_minor=max(0, target),
        ambition=ambition,
        reasoning=reasoning or "Geçmiş ortalama temel alındı.",
    )


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest) -> SuggestResponse:
    payload = json.dumps(
        {
            "history": [{"period": h.period, "revenue_minor": h.revenue_minor} for h in req.history],
            "ambition": req.ambition,
        },
        ensure_ascii=False,
    )
    prompt = (
        f"Veri:\n{payload}\n\n"
        f"Hedef agresifliği: {req.ambition}\n"
        "Format'ı bozmadan TARGET / AMBITION / REASONING üç satırını yaz."
    )
    text = await gemini.generate(
        prompt,
        system=SYSTEM_PROMPT,
        temperature=0.3,
    )
    return _parse(text, fallback=req.ambition)
