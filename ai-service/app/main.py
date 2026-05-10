import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    agent,
    bank,
    cashflow,
    chat,
    customers,
    finance,
    goals,
    health,
    images,
    insights,
    messages,
    products,
    receipt_ocr,
    reviews,
)

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
app.include_router(insights.router)
app.include_router(messages.router)
app.include_router(customers.router)
app.include_router(images.router)
app.include_router(agent.router)
app.include_router(reviews.router)
app.include_router(goals.router)
app.include_router(finance.router)
app.include_router(bank.router)
app.include_router(receipt_ocr.router)
app.include_router(cashflow.router)
