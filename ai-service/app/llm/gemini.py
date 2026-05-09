from collections.abc import AsyncIterator
from typing import Literal

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import get_settings


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def _to_contents(messages: list[Message]) -> list[types.Content]:
    """Map our Message[] to google-genai's Content[] (user/model roles)."""
    role_map = {"user": "user", "assistant": "model"}
    return [
        types.Content(
            role=role_map[m.role],
            parts=[types.Part.from_text(text=m.content)],
        )
        for m in messages
    ]


async def stream_chat(
    prompt: str,
    *,
    system: str | None = None,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Yield text chunks from Gemini for a single-turn prompt."""
    client = _client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
    )
    stream = await client.aio.models.generate_content_stream(
        model=get_settings().gemini_model,
        contents=prompt,
        config=config,
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def stream_messages(
    messages: list[Message],
    *,
    system: str | None = None,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Yield text chunks from Gemini for a multi-turn conversation."""
    client = _client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
    )
    stream = await client.aio.models.generate_content_stream(
        model=get_settings().gemini_model,
        contents=_to_contents(messages),
        config=config,
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def generate(
    prompt: str,
    *,
    system: str | None = None,
    temperature: float = 0.7,
) -> str:
    """Single-shot generation; returns the full text."""
    client = _client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
    )
    response = await client.aio.models.generate_content(
        model=get_settings().gemini_model,
        contents=prompt,
        config=config,
    )
    return response.text or ""
