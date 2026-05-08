from collections.abc import AsyncIterator

from google import genai
from google.genai import types

from app.config import get_settings


def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


async def stream_chat(
    prompt: str,
    *,
    system: str | None = None,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Yield text chunks from Gemini for the given prompt."""
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
