from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.product_writer import SYSTEM_PROMPT, build_user_prompt

router = APIRouter(prefix="/products", tags=["products"])


class DescribeRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    sku: str | None = Field(default=None, max_length=40)
    category: str | None = Field(default=None, max_length=80)
    keywords: str | None = Field(default=None, max_length=400)
    tone: Literal["professional", "casual", "playful"] = "professional"


class DescribeResponse(BaseModel):
    text: str


@router.post("/describe", response_model=DescribeResponse)
async def describe(req: DescribeRequest) -> DescribeResponse:
    prompt = build_user_prompt(
        name=req.name,
        sku=req.sku,
        category=req.category,
        keywords=req.keywords,
        tone=req.tone,
    )
    text = await gemini.generate(
        prompt,
        system=SYSTEM_PROMPT,
        temperature=0.6,
    )
    return DescribeResponse(text=text.strip())
