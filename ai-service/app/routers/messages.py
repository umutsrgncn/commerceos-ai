from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.message_writer import SYSTEM_PROMPT, build_user_prompt

router = APIRouter(prefix="/messages", tags=["messages"])

MessageIntent = Literal["shipped", "delayed", "thanks", "apology", "cancelled"]


class DraftRequest(BaseModel):
    intent: MessageIntent
    order_number: str = Field(..., max_length=40)
    customer_name: str = Field(..., max_length=120)
    total_label: str | None = Field(default=None, max_length=40)
    extra_context: str | None = Field(default=None, max_length=600)


class DraftResponse(BaseModel):
    text: str


@router.post("/draft", response_model=DraftResponse)
async def draft(req: DraftRequest) -> DraftResponse:
    prompt = build_user_prompt(
        intent=req.intent,
        order_number=req.order_number,
        customer_name=req.customer_name,
        total_label=req.total_label,
        extra_context=req.extra_context,
    )
    text = await gemini.generate(
        prompt,
        system=SYSTEM_PROMPT,
        temperature=0.5,
    )
    return DraftResponse(text=text.strip())
