"""Anomaly detection — son 7 gün ile önceki 4 hafta baseline kıyaslaması.
%50+ sapma olan metrikleri Gemini'ye sun, açıklama + severity dönsün.
"""

import json
import logging
import re
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.db import fetch_rows
from app.llm import gemini

log = logging.getLogger(__name__)
router = APIRouter(prefix="/finance", tags=["finance"])

DEVIATION_THRESHOLD = 0.30  # %30 sapma trigger


# ─── Anomaly metrics queries ────────────────────────────────────────────────


async def _revenue_window(days: int, offset_days: int = 0) -> int:
    """Belirli bir günsayısı pencerede toplam gelir (kuruş).
    offset=0 → bugünden geriye `days` gün."""
    sql = f"""
    SELECT COALESCE(SUM(total), 0) AS total FROM "Order"
    WHERE status NOT IN ('CANCELLED', 'REFUNDED')
      AND "createdAt" >= NOW() - INTERVAL '{offset_days + days} days'
      AND "createdAt" < NOW() - INTERVAL '{offset_days} days'
    """
    rows = await fetch_rows(sql, 1)
    return int(rows[0]["total"]) if rows else 0


async def _expense_by_category_window(
    days: int, offset_days: int = 0
) -> dict[str, int]:
    sql = f"""
    SELECT category, COALESCE(SUM(amount), 0) AS total FROM "Expense"
    WHERE date >= NOW() - INTERVAL '{offset_days + days} days'
      AND date < NOW() - INTERVAL '{offset_days} days'
    GROUP BY category
    """
    rows = await fetch_rows(sql, 20)
    return {str(r["category"]): int(r["total"]) for r in rows}


async def _order_count_window(days: int, offset_days: int = 0) -> int:
    sql = f"""
    SELECT COUNT(*) AS c FROM "Order"
    WHERE status NOT IN ('CANCELLED', 'REFUNDED')
      AND "createdAt" >= NOW() - INTERVAL '{offset_days + days} days'
      AND "createdAt" < NOW() - INTERVAL '{offset_days} days'
    """
    rows = await fetch_rows(sql, 1)
    return int(rows[0]["c"]) if rows else 0


# ─── Comparison logic ───────────────────────────────────────────────────────


def _percent_change(current: float, baseline: float) -> float | None:
    if baseline == 0:
        return None if current == 0 else float("inf")
    return (current - baseline) / baseline


def _detect_deviations() -> list[dict[str, Any]]:
    """Sync placeholder — real impl needs async. See below."""
    raise NotImplementedError


async def _detect_anomalies() -> list[dict[str, Any]]:
    """Son 7 gün vs önceki 28 gün ortalaması. Pro-rate baseline'ı 7 güne."""
    cur_revenue = await _revenue_window(days=7, offset_days=0)
    base_revenue_28 = await _revenue_window(days=28, offset_days=7)
    base_revenue_avg7 = base_revenue_28 / 4  # 28g → 7g eşdeğeri

    cur_orders = await _order_count_window(days=7, offset_days=0)
    base_orders_28 = await _order_count_window(days=28, offset_days=7)
    base_orders_avg7 = base_orders_28 / 4

    cur_exp_by_cat = await _expense_by_category_window(days=7, offset_days=0)
    base_exp_by_cat = await _expense_by_category_window(days=28, offset_days=7)

    candidates: list[dict[str, Any]] = []

    # Revenue
    rev_change = _percent_change(cur_revenue, base_revenue_avg7)
    if rev_change is not None and abs(rev_change) >= DEVIATION_THRESHOLD:
        candidates.append({
            "metric": "revenue_7d",
            "label": "Haftalık ciro",
            "current_minor": cur_revenue,
            "baseline_minor": int(base_revenue_avg7),
            "change_pct": round(rev_change * 100, 1),
        })

    # Order count
    if base_orders_avg7 > 0:
        orders_change = _percent_change(cur_orders, base_orders_avg7)
        if orders_change is not None and abs(orders_change) >= DEVIATION_THRESHOLD:
            candidates.append({
                "metric": "orders_7d",
                "label": "Sipariş sayısı",
                "current_count": cur_orders,
                "baseline_count": round(base_orders_avg7, 1),
                "change_pct": round(orders_change * 100, 1),
            })

    # Each expense category (prorated baseline)
    for cat, cur_amount in cur_exp_by_cat.items():
        base = base_exp_by_cat.get(cat, 0) / 4
        change = _percent_change(cur_amount, base)
        if change is None:
            continue
        if abs(change) < DEVIATION_THRESHOLD and cur_amount < 50000:
            continue  # küçük ve yakın değişim — gözardı
        if cur_amount < 5000 and base < 5000:
            continue  # çok küçük tutarlar (gürültü)
        candidates.append({
            "metric": f"expense_{cat}",
            "label": f"Gider: {cat}",
            "current_minor": cur_amount,
            "baseline_minor": int(base),
            "change_pct": round(change * 100, 1) if change != float("inf") else None,
            "category": cat,
        })

    # Profit margin proxy: revenue - total expenses
    cur_total_exp = sum(cur_exp_by_cat.values())
    base_total_exp = sum(base_exp_by_cat.values()) / 4
    cur_margin = (
        (cur_revenue - cur_total_exp) / cur_revenue * 100 if cur_revenue > 0 else 0
    )
    base_margin = (
        (base_revenue_avg7 - base_total_exp) / base_revenue_avg7 * 100
        if base_revenue_avg7 > 0
        else 0
    )
    margin_diff = cur_margin - base_margin
    if abs(margin_diff) >= 5:  # 5 puan margin sapması
        candidates.append({
            "metric": "margin_7d",
            "label": "Net marj",
            "current_pct": round(cur_margin, 1),
            "baseline_pct": round(base_margin, 1),
            "change_points": round(margin_diff, 1),
        })

    return candidates


# ─── Gemini explainer ───────────────────────────────────────────────────────

EXPLAIN_SYSTEM = """Sen bir e-ticaret finansal analiz asistanısın. Türkçe yanıtla.
Sana sapma tespit edilmiş metrikler verilecek. Her biri için:
- severity: 'high' (acil aksiyon), 'medium' (dikkat), 'low' (bilgi)
- title: 5-8 kelimelik özet (örn 'MARKETING gideri %180 artmış')
- explanation: 1-2 cümle, neden riskli/dikkat çekici
- action: 1 cümle, ne yapmalı

ÇIKTI: SADECE JSON, başka metin yok:
{
  "anomalies": [
    {"metric": "<verilen metric>", "severity": "high|medium|low",
     "title": "...", "explanation": "...", "action": "..."}
  ],
  "summary": "<TR 1 cümle: genel görünüm>"
}

Metric pozitif (artış) iyi olabilir (gelir/sipariş artmış). Negatif (düşüş)
genelde kötü. Gider artışı kötü. Gider düşüşü iyi olabilir ama 'kasıtlı
mı?' diye bakılır. Marj düşüşü kötü. Sezgisel ol, otomat değil."""


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group(0))
        except json.JSONDecodeError:
            pass
    return None


# ─── Models + endpoint ──────────────────────────────────────────────────────


class Anomaly(BaseModel):
    metric: str
    severity: str
    title: str
    explanation: str
    action: str
    current: str | None = None
    baseline: str | None = None
    change_pct: float | None = None


class AnomalyScanResponse(BaseModel):
    anomalies: list[Anomaly]
    summary: str
    candidates_evaluated: int = 0


@router.post("/anomaly/scan", response_model=AnomalyScanResponse)
async def anomaly_scan() -> AnomalyScanResponse:
    deviations = await _detect_anomalies()

    if not deviations:
        return AnomalyScanResponse(
            anomalies=[],
            summary="Anormallik tespit edilmedi. Bütün metrikler normal aralıkta.",
            candidates_evaluated=0,
        )

    # Format current/baseline strings for display + Gemini context
    for d in deviations:
        if "current_minor" in d:
            d["current"] = f"{d['current_minor'] / 100:.0f} TL"
            d["baseline"] = f"{d['baseline_minor'] / 100:.0f} TL"
        elif "current_count" in d:
            d["current"] = f"{d['current_count']} adet"
            d["baseline"] = f"{d['baseline_count']:.1f} adet"
        elif "current_pct" in d:
            d["current"] = f"%{d['current_pct']}"
            d["baseline"] = f"%{d['baseline_pct']}"

    # Gemini'ye sun
    prompt_lines = ["Aşağıdaki sapmalar son 7 gün vs önceki 4 hafta ortalaması:", ""]
    for d in deviations:
        line = f"- metric={d['metric']} | {d['label']}"
        if "change_pct" in d and d["change_pct"] is not None:
            sign = "+" if d["change_pct"] > 0 else ""
            line += f" | değişim: {sign}{d['change_pct']}%"
        if "change_points" in d:
            sign = "+" if d["change_points"] > 0 else ""
            line += f" | değişim: {sign}{d['change_points']} puan"
        line += f" | mevcut: {d.get('current', '?')}"
        line += f" | baseline: {d.get('baseline', '?')}"
        prompt_lines.append(line)

    prompt_lines.append("")
    prompt_lines.append("Her birini severity + açıklama + aksiyon ile JSON döndür.")
    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(prompt, system=EXPLAIN_SYSTEM, temperature=0.2)
    data = _extract_json(text)

    if not data or "anomalies" not in data:
        # Fallback: deterministik raporla
        return _fallback_response(deviations)

    anomalies: list[Anomaly] = []
    for a in data["anomalies"][:8]:
        try:
            metric = str(a.get("metric") or "")
            # Eşle: deviations'ta var mı?
            match = next((d for d in deviations if d["metric"] == metric), None)
            anomalies.append(
                Anomaly(
                    metric=metric,
                    severity=str(a.get("severity") or "low").lower(),
                    title=str(a.get("title") or ""),
                    explanation=str(a.get("explanation") or ""),
                    action=str(a.get("action") or ""),
                    current=match.get("current") if match else None,
                    baseline=match.get("baseline") if match else None,
                    change_pct=match.get("change_pct") if match else None,
                )
            )
        except (ValueError, TypeError):
            continue

    return AnomalyScanResponse(
        anomalies=anomalies,
        summary=str(data.get("summary") or ""),
        candidates_evaluated=len(deviations),
    )


def _fallback_response(deviations: list[dict[str, Any]]) -> AnomalyScanResponse:
    anomalies = []
    for d in deviations[:5]:
        change = d.get("change_pct")
        sev = "low"
        if change is not None and abs(change) >= 80:
            sev = "high"
        elif change is not None and abs(change) >= 50:
            sev = "medium"
        sign = "+" if change and change > 0 else ""
        title = f"{d['label']} {sign}{change}%" if change is not None else d["label"]
        anomalies.append(
            Anomaly(
                metric=d["metric"],
                severity=sev,
                title=title,
                explanation=f"{d['label']}: {d.get('current')} (baseline {d.get('baseline')}).",
                action="Detayları incele, gerekirse manuel müdahale et.",
                current=d.get("current"),
                baseline=d.get("baseline"),
                change_pct=change,
            )
        )
    return AnomalyScanResponse(
        anomalies=anomalies,
        summary=f"{len(deviations)} sapma tespit edildi (basit modda).",
        candidates_evaluated=len(deviations),
    )
