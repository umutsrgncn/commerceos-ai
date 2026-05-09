import json
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.insights import SALES_INSIGHTS_SYSTEM, build_insights_prompt

router = APIRouter(prefix="/insights", tags=["insights"])


class SalesInsightsRequest(BaseModel):
    period_label: str = Field(..., max_length=80)
    stats: dict[str, Any]


@router.post("/sales/stream")
async def sales_insights_stream(req: SalesInsightsRequest) -> StreamingResponse:
    prompt = build_insights_prompt(
        json.dumps(req.stats, ensure_ascii=False, indent=2),
        req.period_label,
    )

    async def gen():
        async for chunk in gemini.stream_chat(
            prompt, system=SALES_INSIGHTS_SYSTEM, temperature=0.4
        ):
            yield chunk

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")
