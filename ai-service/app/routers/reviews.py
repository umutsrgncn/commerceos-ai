from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.review_analysis import (
    SYSTEM_PROMPT as ANALYSIS_PROMPT,
    build_prompt as build_analysis_prompt,
)
from app.prompts.review_reply import (
    SYSTEM_PROMPT as REPLY_PROMPT,
    build_prompt as build_reply_prompt,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


# ─── Bulk analiz ─────────────────────────────────────────────────────────────


class ReviewItem(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    body: str
    author_name: str | None = None
    created_at: str | None = None


class AnalyzeRequest(BaseModel):
    reviews: list[ReviewItem] = Field(..., min_length=1, max_length=200)


class AnalyzeResponse(BaseModel):
    overall: str  # 'pozitif' | 'nötr' | 'negatif'
    score: int
    positives: str
    negatives: str
    repeated_complaint: str
    action: str
    raw: str


def _parse_analysis(text: str) -> AnalyzeResponse:
    """SYSTEM_PROMPT'taki 6 satırlık formatı parse et."""
    overall = ""
    score = 0
    positives = ""
    negatives = ""
    repeated = ""
    action = ""

    for line in text.strip().splitlines():
        upper = line.upper()
        value = line.split(":", 1)[-1].strip() if ":" in line else line.strip()

        if upper.startswith("GENEL"):
            overall = value.lower()
        elif upper.startswith("PUAN"):
            try:
                score = int("".join(c for c in value if c.isdigit() or c == "-"))
            except ValueError:
                score = 0
        elif upper.startswith("ÖNE ÇIKAN OLUMLU") or upper.startswith("ONE CIKAN OLUMLU"):
            positives = value
        elif upper.startswith("ÖNE ÇIKAN OLUMSUZ") or upper.startswith("ONE CIKAN OLUMSUZ"):
            negatives = value
        elif upper.startswith("TEKRAR EDEN") or "ŞIKAYET" in upper or "SIKAYET" in upper:
            repeated = value
        elif upper.startswith("AKSİYON") or upper.startswith("AKSIYON"):
            action = value

    return AnalyzeResponse(
        overall=overall or "nötr",
        score=max(0, min(100, score)),
        positives=positives,
        negatives=negatives,
        repeated_complaint=repeated,
        action=action,
        raw=text.strip(),
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    payload = [
        {
            "rating": r.rating,
            "body": r.body,
            "author_name": r.author_name,
            "created_at": r.created_at,
        }
        for r in req.reviews
    ]
    prompt = build_analysis_prompt(payload)
    text = await gemini.generate(
        prompt,
        system=ANALYSIS_PROMPT,
        temperature=0.3,
    )
    return _parse_analysis(text)


# ─── Tek yoruma cevap önerisi ────────────────────────────────────────────────


class ReplyRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    body: str
    author_name: str = Field(..., max_length=120)
    product_name: str = Field(..., max_length=160)
    company_name: str | None = Field(default=None, max_length=120)


class ReplyResponse(BaseModel):
    text: str


@router.post("/reply", response_model=ReplyResponse)
async def reply(req: ReplyRequest) -> ReplyResponse:
    prompt = build_reply_prompt(
        rating=req.rating,
        body=req.body,
        author_name=req.author_name,
        product_name=req.product_name,
        company_name=req.company_name,
    )
    text = await gemini.generate(
        prompt,
        system=REPLY_PROMPT,
        temperature=0.5,
    )
    return ReplyResponse(text=text.strip())
