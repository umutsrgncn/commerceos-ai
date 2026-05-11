from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm import gemini
from app.prompts.kvkk import KVKK_SYSTEM, build_privacy_prompt

router = APIRouter(prefix="/kvkk", tags=["kvkk"])


class PrivacyPolicyRequest(BaseModel):
    company_name: str = Field(..., max_length=200)
    tax_id: str = Field("", max_length=20)
    address: str = Field("", max_length=500)
    email: str = Field("", max_length=120)
    phone: str = Field("", max_length=40)
    dpo_email: str = Field("", max_length=120)
    data_controller: str = Field("", max_length=200)


class PrivacyPolicyResponse(BaseModel):
    text: str


@router.post("/privacy-policy", response_model=PrivacyPolicyResponse)
async def generate_privacy_policy(req: PrivacyPolicyRequest) -> PrivacyPolicyResponse:
    prompt = build_privacy_prompt(
        company_name=req.company_name,
        tax_id=req.tax_id,
        address=req.address,
        email=req.email,
        phone=req.phone,
        dpo_email=req.dpo_email,
        data_controller=req.data_controller,
    )
    today = date.today().strftime("%d.%m.%Y")
    system = KVKK_SYSTEM.replace("{bugün}", today)
    text = await gemini.generate(prompt, system=system, temperature=0.3)
    return PrivacyPolicyResponse(text=text.strip())
