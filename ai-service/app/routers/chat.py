from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.llm import gemini
from app.llm.gemini import Message

router = APIRouter(prefix="/chat", tags=["chat"])

ADMIN_ASSISTANT_SYSTEM = """Sen CommerceOS adlı bir e-ticaret yönetici panelinin yardımcısısın.
Kullanıcı dükkân sahibi ya da yönetici. Türkçe konuş.

Yardım edebileceğin başlıklar:
- Ürün açıklaması ve metin yazımı
- Sipariş süreçleri ve durum geçişleri
- Müşteri iletişimi şablonları (özür, teşekkür, kargo bildirimi)
- Satış verileri yorumu (kullanıcı sayı verirse)
- Kampanya / kategori önerileri

Bilmediğin veriyi UYDURMA — kullanıcıya 'panelden şunu kontrol edebilirsin' diye yönlendir.
Cevaplarını kısa ve uygulanabilir tut."""


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    system: str | None = Field(default=None, max_length=4000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class MessagesRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1, max_length=40)
    system: str | None = Field(default=None, max_length=4000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


@router.post("/stream")
async def chat_stream(req: ChatRequest) -> StreamingResponse:
    async def gen():
        async for chunk in gemini.stream_chat(
            req.prompt, system=req.system, temperature=req.temperature
        ):
            yield chunk

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


@router.post("/messages/stream")
async def chat_messages_stream(req: MessagesRequest) -> StreamingResponse:
    """Multi-turn streaming chat. Used by the admin assistant."""
    system = req.system or ADMIN_ASSISTANT_SYSTEM

    async def gen():
        async for chunk in gemini.stream_messages(
            req.messages, system=system, temperature=req.temperature
        ):
            yield chunk

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


@router.post("")
async def chat_once(req: ChatRequest) -> dict[str, str]:
    text = await gemini.generate(
        req.prompt, system=req.system, temperature=req.temperature
    )
    return {"text": text}
