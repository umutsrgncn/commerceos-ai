"""Tool-aware streaming chat endpoint.

İki tool var: query_database (read-only Postgres SELECT) ve render_chart.
Model gerçek SQL yazar, biz sanitise edip çalıştırırız. Read-only DB user
zaten yazma denemesini reddeder, ama önce hızlı bir SQL guard çalıştırıyoruz.

Akış:
  1. Kullanıcı mesajları + sistem promptu (schema doc dahil) Gemini'ye gider
  2. Gemini SELECT yazar → query_database çağırır
  3. Sonuçlar Gemini'ye function_response olarak geri verilir
  4. Gemini ya başka sorgu çağırır ya da final yanıtı yazar (max 6 tur)
  5. Final metin + render_chart blokları istemciye stream'lenir

Frontend bu yanıtı satır bazlı JSON event stream olarak alır:
  {"type": "tool_call", "name": "...", "args": {...}}
  {"type": "tool_result", "name": "...", "ok": true/false}
  {"type": "delta", "text": "..."}
  {"type": "done"}
"""

import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import get_settings
from app.tools.definitions import TOOLS
from app.tools.executor import execute_tool
from app.tools.schema_doc import DATABASE_SCHEMA_DOC

router = APIRouter(prefix="/chat", tags=["agent"])

log = logging.getLogger(__name__)

MAX_TOOL_TURNS = 6

AGENT_SYSTEM_PROMPT = f"""Sen CommerceOS yönetici panelinin AI asistanısın.
Mağaza sahibi/yöneticisi sana panel verisi hakkında sorular sorar. Türkçe konuş.

ARAÇLAR:
- query_database(sql, explanation?): Postgres'e SELECT cümlesi gönder.
  Read-only kullanıcıyla bağlanır — yazma denemesi reddedilir.
  Model yan etkili komutları (INSERT/UPDATE/DDL) ASLA çağırmasın.
- render_chart(type, title, labels, values, unit?): Cevabın içine grafik blok
  ekle. SADECE veri topladıktan SONRA çağır — kendi uydurduğun sayı ÇİZME.

VERİ TABANI ŞEMASI:
{DATABASE_SCHEMA_DOC}

KURALLAR:
1. Veri lazım olan SORULARDA query_database mutlaka çağır. UYDURMA.
2. Para tutarları minor units (kuruş) cinsinden gelir. Cevabında 100'e böl
   ve TR locale ile yaz: "1.234,50 ₺". Chart values alanına da TL olarak yaz
   (kuruş değil) — frontend olduğu gibi gösterir.
3. Tarihleri TR formatına çevir: "9 Mayıs 2026" gibi. Chart label'ları daha
   kısa: "9 May" veya "Mayıs" yeter.
4. SQL injection guard otomatik var ama kullanıcı girdisini doğrudan SQL'e
   gömme — kullanıcı 'pamuk tişört' diye soruyorsa name ILIKE '%pamuk%'
   şeklinde sorgu yaz, kullanıcının verdiği metni yansıt.
5. Sorgu hata verirse hatayı oku, düzelt, tekrar çağır (max 6 tur).
6. Cevapların kısa ve aksiyon önerili olsun. Pazarlama dili kullanma.

GRAFİK KULLANIMI (ÇOK ÖNEMLİ):
Aşağıdaki SORU TÜRLERİNDE render_chart MUTLAKA çağırılmalı — kullanıcı
"grafik" demese bile:
  • Trend: "son N gün/hafta/ay ciro/sipariş trendi" → type='line'
  • Karşılaştırma: "kategori bazında satış", "duruma göre dağılım" → type='bar'
  • En çok / en az: "top 5 ürün", "en çok satan" → type='bar'
  • Dönemsel: "haftalık/aylık satış" → type='line' veya 'bar'

KURALLAR:
- Önce query_database ile veriyi çek, SONRA render_chart çağır.
- labels ve values aynı uzunlukta olmalı.
- values'a TL olarak yaz (kuruş değil): SQL'den 184500 geldiyse 1845 yaz.
- title kısa ve anlamlı: "Son 30 Günün Ciro Trendi", "En Çok Satan 5 Ürün".
- unit: "₺" (para), "adet" (sayı), "%" (oran).
- En az 2 veri noktası varsa grafik çiz, tek noktaysa metin yeterli.
- Grafik çağırdıktan sonra final metnin kısa olsun (1-2 cümle yorum) —
  rakamları metinde tekrar etme, grafik zaten gösterir.

ÖRNEK 1:
Soru: "Geçen 7 günün ciro trendi?"
Adımlar:
  1. query_database: SELECT DATE("createdAt") as d, SUM(total) FROM "Order"
     WHERE "createdAt" >= NOW() - INTERVAL '7 days' AND status NOT IN
     ('CANCELLED', 'REFUNDED') GROUP BY d ORDER BY d
  2. render_chart: type='line', title='Son 7 Günlük Ciro',
     labels=['1 May', '2 May', ...], values=[125, 340, ...] (TL),
     unit='₺'
  3. Kısa yorum: "Çarşamba günü zirvede 340₺ ciro. Hafta sonu daha sakin."

ÖRNEK 2:
Soru: "Sipariş durumu dağılımı?"
Adımlar:
  1. query_database: SELECT status, COUNT(*) FROM "Order" GROUP BY status
  2. render_chart: type='bar', title='Sipariş Durum Dağılımı',
     labels=['Beklemede', 'Onaylandı', 'Kargoda', ...],
     values=[3, 12, 5, ...], unit='adet'
  3. Kısa yorum: "Çoğunluk onaylandı durumunda. 5 sipariş hâlâ kargoda."""


class AgentRequest(BaseModel):
    messages: list[dict] = Field(..., min_length=1, max_length=40)


def _build_contents(messages: list[dict]) -> list[types.Content]:
    role_map = {"user": "user", "assistant": "model"}
    out: list[types.Content] = []
    for m in messages:
        role = role_map.get(m.get("role", "user"), "user")
        content = m.get("content", "")
        if not content:
            continue
        out.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=content)],
            )
        )
    return out


def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def _emit(event: dict) -> bytes:
    return (json.dumps(event, ensure_ascii=False) + "\n").encode("utf-8")


async def _agent_loop(messages: list[dict]) -> AsyncIterator[bytes]:
    client = _client()
    contents = _build_contents(messages)

    config = types.GenerateContentConfig(
        system_instruction=AGENT_SYSTEM_PROMPT,
        temperature=0.4,
        tools=TOOLS,
    )

    for _turn in range(MAX_TOOL_TURNS):
        response = await client.aio.models.generate_content(
            model=get_settings().gemini_model,
            contents=contents,
            config=config,
        )

        candidate = response.candidates[0] if response.candidates else None
        if not candidate or not candidate.content:
            yield _emit({"type": "delta", "text": "(yanıt alınamadı)"})
            break

        function_calls: list[types.FunctionCall] = []
        text_chunks: list[str] = []

        for part in candidate.content.parts or []:
            if part.function_call and part.function_call.name:
                function_calls.append(part.function_call)
            elif part.text:
                text_chunks.append(part.text)

        for chunk in text_chunks:
            yield _emit({"type": "delta", "text": chunk})

        if not function_calls:
            break

        contents.append(candidate.content)

        function_response_parts: list[types.Part] = []
        for fc in function_calls:
            args = dict(fc.args or {})
            yield _emit({"type": "tool_call", "name": fc.name, "args": args})

            try:
                result = await execute_tool(fc.name, args)
                ok = "error" not in result
            except Exception as err:  # noqa: BLE001
                log.exception("Tool %s execution failed", fc.name)
                result = {"error": str(err)}
                ok = False

            yield _emit({"type": "tool_result", "name": fc.name, "ok": ok})

            function_response_parts.append(
                types.Part.from_function_response(
                    name=fc.name,
                    response=result,
                )
            )

        contents.append(
            types.Content(role="user", parts=function_response_parts)
        )
    else:
        yield _emit(
            {"type": "delta", "text": "\n[Tool döngüsü maksimum tura ulaştı.]"}
        )

    yield _emit({"type": "done"})


@router.post("/agent/stream")
async def chat_agent_stream(req: AgentRequest) -> StreamingResponse:
    return StreamingResponse(
        _agent_loop(req.messages),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-store"},
    )
