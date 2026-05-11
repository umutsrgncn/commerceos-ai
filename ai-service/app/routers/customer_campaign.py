"""Customer email campaign — segment + amaç verir, AI içerik üretir."""

import json
import logging
import re

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini

log = logging.getLogger(__name__)
router = APIRouter(prefix="/customers", tags=["customers"])


CAMPAIGN_SYSTEM = """Sen bir e-ticaret email marketing uzmanısın. Türkçe yazıyorsun.
Sana hedef segment + kampanya amacı + ek bağlam verilecek; sen samimi,
kişiselleştirilmiş bir email yazacaksın.

ÇIKTI: SADECE JSON, başka metin yok.
{
  "subject": "<TR konu, max 80 karakter>",
  "body": "<TR mail metni, 5-10 satır, paragraflar arası boş satır,
            sonunda saygılı imza ('Sevgilerle, ekibiniz' gibi)>"
}

Email tonu segmente göre:
- 'sadık': samimi + minnet + özel teklif
- 'VIP': premium dil + erken erişim + kişisel dokunuş
- 'yeni': hoş geldin + ürün tanıtımı + indirim kodu
- 'risky': geri dönüş daveti + fırsat + şahsi mesaj
- 'all': genel + net + güçlü CTA"""


class CampaignDraftRequest(BaseModel):
    segment: str = Field(..., max_length=40) # 'sadık' | 'VIP' | 'yeni' | 'risky' | 'all'
    intent: str = Field(..., max_length=200) # 'yaz indirimi' | 'yeni koleksiyon' | 'birthday' | vb.
    company_name: str | None = Field(default=None, max_length=120)
    discount_code: str | None = Field(default=None, max_length=30)
    discount_pct: int | None = Field(default=None, ge=0, le=100)
    extra_context: str | None = Field(default=None, max_length=500)


class CampaignDraftResponse(BaseModel):
    subject: str
    body: str


@router.post("/campaign/draft", response_model=CampaignDraftResponse)
async def draft_campaign(
    req: CampaignDraftRequest,
) -> CampaignDraftResponse:
    prompt_lines = [
        f"HEDEF SEGMENT: {req.segment}",
        f"KAMPANYA AMACI: {req.intent}",
    ]
    if req.company_name:
        prompt_lines.append(f"FİRMA: {req.company_name}")
    if req.discount_code and req.discount_pct:
        prompt_lines.append(
            f"İNDİRİM KODU: {req.discount_code} (%{req.discount_pct})"
        )
    if req.extra_context:
        prompt_lines.append(f"EK BİLGİ: {req.extra_context}")

    prompt_lines.append("")
    prompt_lines.append("Email yaz. JSON döndür.")
    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(
        prompt, system=CAMPAIGN_SYSTEM, temperature=0.5
    )
    text = text.strip()

    data = None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                pass

    if not data or "subject" not in data:
        # Fallback template
        return CampaignDraftResponse(
            subject=f"{req.intent} — sizin için özel",
            body=(
                f"Merhaba,\n\n"
                f"{req.intent} ile ilgili size özel bir teklifimiz var. "
                f"{f'{req.discount_code} kodu ile %{req.discount_pct} indirim kazanabilirsiniz. ' if req.discount_code else ''}"
                f"Daha fazlası için sitemizi ziyaret edin.\n\n"
                f"Sevgilerle,\n{req.company_name or 'Ekibiniz'}"
            ),
        )

    return CampaignDraftResponse(
        subject=str(data.get("subject") or ""),
        body=str(data.get("body") or ""),
    )
