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
