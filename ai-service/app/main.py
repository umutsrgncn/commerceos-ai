import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat, health, products

settings = get_settings()
logging.basicConfig(level=settings.log_level.upper())

app = FastAPI(
    title="CommerceOS AI Service",
    version="0.1.0",
    description="Internal Gemini-powered service for the CommerceOS admin.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened later via Next.js rewrite
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(products.router)
