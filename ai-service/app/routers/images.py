import base64
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm import imagen
from app.prompts.product_image import (
    PRODUCT_NEGATIVE_PROMPT,
    build_product_image_prompt,
)

router = APIRouter(prefix="/images", tags=["images"])

ProductImageStyle = Literal["studio", "lifestyle", "minimal", "dark"]


class ProductImageRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=80)
    style: ProductImageStyle = "studio"
    count: int = Field(default=1, ge=1, le=4)
    aspect_ratio: Literal["1:1", "3:4", "4:3", "16:9"] = "1:1"


class ProductImageResponse(BaseModel):
    images_b64: list[str]
    prompt: str


@router.post("/product", response_model=ProductImageResponse)
async def generate_product_image(req: ProductImageRequest) -> ProductImageResponse:
    prompt = build_product_image_prompt(
        name=req.name,
        description=req.description,
        category=req.category,
        style=req.style,
    )

    try:
        images = await imagen.generate_images(
            prompt,
            count=req.count,
            aspect_ratio=req.aspect_ratio,
            negative_prompt=PRODUCT_NEGATIVE_PROMPT,
        )
    except Exception as err:  # google.genai surface-level errors
        raise HTTPException(status_code=502, detail=f"Imagen error: {err}") from err

    if not images:
        raise HTTPException(
            status_code=422,
            detail="Imagen güvenlik filtresi tüm sonuçları engelledi. Prompt'u sadeleştir.",
        )

    return ProductImageResponse(
        images_b64=[base64.b64encode(b).decode("ascii") for b in images],
        prompt=prompt,
    )
