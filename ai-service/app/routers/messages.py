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


# ─── Supplier reorder mail (otopilot) ───────────────────────────────────────


SUPPLIER_REORDER_SYSTEM = """Sen bir e-ticaret operasyon asistanısın. Türkçe
yazıyorsun. Stoğu kritik seviyeye düşmüş bir ürün için tedarikçiye
sipariş maili yazacaksın. Profesyonel, kısa, net.

JSON döndür: {"subject": "...", "body": "..."}
Body 5-8 satır, açık paragraflar. Lead time teyidi iste."""


class SupplierMailRequest(BaseModel):
    supplier_name: str = Field(..., max_length=160)
    contact_person: str | None = Field(default=None, max_length=120)
    product_name: str = Field(..., max_length=160)
    sku: str = Field(..., max_length=60)
    current_stock: int = Field(..., ge=0)
    target_quantity: int = Field(..., gt=0)
    lead_time_days: int = Field(default=7, ge=0, le=120)


class SupplierMailResponse(BaseModel):
    subject: str
    body: str


@router.post("/supplier-reorder", response_model=SupplierMailResponse)
async def supplier_reorder(req: SupplierMailRequest) -> SupplierMailResponse:
    import json
    import re

    prompt_lines = [f"TEDARİKÇİ: {req.supplier_name}"]
    if req.contact_person:
        prompt_lines.append(f"İLGİLİ KİŞİ: {req.contact_person}")
    prompt_lines.extend(
        [
            f"ÜRÜN: {req.product_name} (SKU {req.sku})",
            f"MEVCUT STOK: {req.current_stock} adet",
            f"İSTENEN MİKTAR: {req.target_quantity} adet",
            f"BEKLENEN LEAD TIME: {req.lead_time_days} gün",
            "",
            "Sipariş maili yaz. JSON döndür: {subject, body}",
        ]
    )
    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(
        prompt, system=SUPPLIER_REORDER_SYSTEM, temperature=0.4
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

    if not data or "subject" not in data or "body" not in data:
        return SupplierMailResponse(
            subject=f"Sipariş: {req.product_name} ({req.sku}) - {req.target_quantity} adet",
            body=(
                f"Merhaba {req.contact_person or req.supplier_name},\n\n"
                f"Stoğumuz {req.current_stock} adete düştü. {req.product_name} "
                f"(SKU: {req.sku}) için {req.target_quantity} adet sipariş geçmek "
                f"istiyoruz.\n\nLead time {req.lead_time_days} gün olarak teyit "
                f"ederseniz hemen onaylayalım.\n\nİyi çalışmalar."
            ),
        )

    return SupplierMailResponse(
        subject=str(data.get("subject") or ""),
        body=str(data.get("body") or ""),
    )
