"""Cash flow forecast — önümüzdeki 30 gün için günlük gelir/gider/bakiye
projeksiyonu ve risk uyarıları üretir.

Akış:
1. DB'den son 90 gün sipariş + gider verisi al (read-only user)
2. Bekleyen siparişleri ve tekrarlayan giderleri tespit et
3. Gemini'ye istatistik özetini ver, 30-günlük forecast iste
4. Yapılandırılmış JSON döndür: günlük seri + risk uyarıları

Hackathon kapsamı: AI tahmini özetleyici, gerçek finansal model değil.
"""

import json
import logging
import re
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db import fetch_rows
from app.llm import gemini

log = logging.getLogger(__name__)

router = APIRouter(prefix="/finance", tags=["finance"])

FORECAST_DAYS = 30
HISTORY_DAYS = 90


FORECAST_SYSTEM = """Sen bir finansal analiz asistanısın. Türkçe yanıt veriyorsun.
Bir e-ticaret mağazasının son 90 günlük gelir/gider verisi + bekleyen
siparişleri + KESİN gelecek ödemeleri (maaş, kira, vergi, abonelik)
verilecek. Sen önümüzdeki 30 gün için günlük cash flow projeksiyonu
üreteceksin.

PROJEKSIYON YÖNTEMİ:
- Gelir: bekleyen siparişler tahmini teslim tarihinde + son 90 gün
  ortalama günlük satış (ağırlıklı, yakın günler ağırlıklı)
- Gider: ⚠️ KESİN ÖDEMELER bölümündeki her satır, vade gününde MUTLAKA
  out_minor olarak eklenmeli (maaş/kira/vergi kaçırılmaz). Bunlara ek
  olarak tekrarlayan kategori ortalamalarını ad-hoc gider olarak ekle.
- Bakiye: günlük (gelir - gider) cumulative

ÇIKTI: SADECE JSON, başka metin yok:
{
  "starting_balance_minor": <int kuruş, başlangıç tahmini bakiye>,
  "daily": [
    {"date": "2026-MM-DD", "in_minor": <int>, "out_minor": <int>,
     "balance_minor": <int cumulative>, "note": "<opsiyonel kısa not>"},
    ... toplam 30 gün
  ],
  "warnings": [
    {"date": "2026-MM-DD", "severity": "high"|"medium"|"low",
     "message": "<TR uyarı, neden riskli olduğu>"}
  ],
  "summary": "<TR 1-2 cümle, genel görünüm + ana risk>"
}

Tüm tutarlar KURUŞ (minor unit), pozitif int. Negatif bakiye olabilir.
Risk uyarıları SAVUNULABILIR olmalı (örn. 'X tarihinde kira+personel
çıkışı, gelir az; bakiye -Y bin TL'). En az 1, en çok 4 uyarı."""


# ─── DB queries ─────────────────────────────────────────────────────────────


async def _last_n_day_revenue(days: int) -> list[dict[str, Any]]:
    """Son N günün günlük gelir özeti (sipariş tutarı, iptaller hariç)."""
    sql = f"""
    SELECT DATE("createdAt") AS d, SUM(total) AS gelir, COUNT(*) AS adet
    FROM "Order"
    WHERE "createdAt" >= NOW() - INTERVAL '{days} days'
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY DATE("createdAt")
    ORDER BY d
    """
    return await fetch_rows(sql, days + 5)


async def _last_n_day_expenses(days: int) -> list[dict[str, Any]]:
    """Son N günün günlük + kategori bazlı gider toplamı."""
    sql = f"""
    SELECT DATE(date) AS d, category, SUM(amount) AS amount, COUNT(*) AS adet
    FROM "Expense"
    WHERE date >= NOW() - INTERVAL '{days} days'
    GROUP BY DATE(date), category
    ORDER BY d
    """
    return await fetch_rows(sql, days * 12)


async def _pending_orders() -> list[dict[str, Any]]:
    """Bekleyen siparişler (CANCELLED/DELIVERED dışı)."""
    sql = """
    SELECT id, "orderNumber" AS order_number, status, total, "createdAt" AS created_at
    FROM "Order"
    WHERE status IN ('PENDING', 'CONFIRMED', 'SHIPPED')
    ORDER BY "createdAt" DESC
    LIMIT 50
    """
    return await fetch_rows(sql, 50)


async def _expense_category_rollup(days: int) -> list[dict[str, Any]]:
    """Kategori bazlı son N gün toplam (tekrarlayan pattern tespiti için)."""
    sql = f"""
    SELECT category, SUM(amount) AS amount, COUNT(*) AS occurrences,
           AVG(amount) AS avg_amount
    FROM "Expense"
    WHERE date >= NOW() - INTERVAL '{days} days'
    GROUP BY category
    ORDER BY amount DESC
    """
    return await fetch_rows(sql, 20)


async def _active_scheduled_payments() -> list[dict[str, Any]]:
    """Aktif scheduled ödemeleri (maaş, kira, abonelik) çek."""
    sql = """
    SELECT id, name, amount, category, recurrence, "dueDay" AS due_day,
           "startDate" AS start_date, "endDate" AS end_date, vendor
    FROM "ScheduledPayment"
    WHERE active = true
    ORDER BY amount DESC
    """
    return await fetch_rows(sql, 100)


# ─── Models ─────────────────────────────────────────────────────────────────


class ForecastDay(BaseModel):
    date: str
    in_minor: int
    out_minor: int
    balance_minor: int
    note: str | None = None


class ForecastWarning(BaseModel):
    date: str
    severity: str
    message: str


class ForecastResponse(BaseModel):
    starting_balance_minor: int
    daily: list[ForecastDay]
    warnings: list[ForecastWarning]
    summary: str
    history_days_used: int = HISTORY_DAYS
    pending_orders_count: int = 0


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


# ─── Endpoint ───────────────────────────────────────────────────────────────


@router.post("/cashflow/forecast", response_model=ForecastResponse)
async def cashflow_forecast() -> ForecastResponse:
    rev_rows, exp_rows, pend_rows, cat_rows = await _gather_history()
    sched_rows = await _active_scheduled_payments()

    # 90 günlük net cash (gelir - gider) starting balance kabul edilir
    total_revenue = sum(int(r["gelir"] or 0) for r in rev_rows)
    total_expense = sum(int(r["amount"] or 0) for r in exp_rows)
    starting_balance = total_revenue - total_expense

    today = date.today()

    # 30 gün boyunca düşecek scheduled ödemeleri açalım
    sched_occurrences = _expand_scheduled(sched_rows, today, FORECAST_DAYS)
    total_scheduled = sum(o["amount"] for o in sched_occurrences)

    # Gemini'ye sun
    prompt_lines = [
        f"BUGÜN: {today.isoformat()}",
        f"BAŞLANGIÇ BAKİYESİ (son {HISTORY_DAYS}g net): {starting_balance / 100:.2f} TL",
        f"BEKLEYEN SİPARİŞ SAYISI: {len(pend_rows)}",
        f"ÖNÜMÜZDEKİ 30 GÜN KESİN ÇIKIŞ: {total_scheduled / 100:.2f} TL",
        "",
        f"SON {HISTORY_DAYS} GÜN GÜNLÜK GELİR (örnek):",
    ]
    # Sample some days to keep prompt short
    for r in rev_rows[-30:]:
        prompt_lines.append(
            f"  {r['d']}: {int(r['gelir'] or 0) / 100:.0f} TL ({r['adet']} sipariş)"
        )

    prompt_lines.append("")
    prompt_lines.append(f"SON {HISTORY_DAYS} GÜN KATEGORİ TOPLAMI:")
    for r in cat_rows:
        prompt_lines.append(
            f"  {r['category']}: toplam {int(r['amount'] or 0) / 100:.0f} TL "
            f"({r['occurrences']} kez, ortalama {int(r['avg_amount'] or 0) / 100:.0f} TL)"
        )

    if pend_rows:
        prompt_lines.append("")
        prompt_lines.append("BEKLEYEN SİPARİŞLER (ilk 10):")
        for r in pend_rows[:10]:
            prompt_lines.append(
                f"  {r['order_number']} | {r['status']} | "
                f"{int(r['total'] or 0) / 100:.0f} TL"
            )

    if sched_occurrences:
        prompt_lines.append("")
        prompt_lines.append(
            "KESİN ÖDEMELER (önümüzdeki 30 gün — bunları MUTLAKA out_minor'a ekle):"
        )
        for o in sched_occurrences:
            prompt_lines.append(
                f"  {o['date']} | {o['name']} ({o['category']}): "
                f"{o['amount'] / 100:.0f} TL"
            )

    prompt_lines.append("")
    prompt_lines.append(
        f"30 günlük forecast üret ({today.isoformat()}'den başla, "
        f"{(today + timedelta(days=FORECAST_DAYS - 1)).isoformat()}'e kadar)."
    )

    prompt = "\n".join(prompt_lines)

    text = await gemini.generate(prompt, system=FORECAST_SYSTEM, temperature=0.3)
    data = _extract_json(text)

    if not data or "daily" not in data:
        # Fallback: simple linear projection
        return _fallback_forecast(
            starting_balance=starting_balance,
            rev_rows=rev_rows,
            exp_rows=exp_rows,
            pending_count=len(pend_rows),
        )

    daily_raw = data.get("daily") or []
    daily: list[ForecastDay] = []
    for d in daily_raw[:FORECAST_DAYS]:
        try:
            daily.append(
                ForecastDay(
                    date=str(d.get("date") or ""),
                    in_minor=int(d.get("in_minor") or 0),
                    out_minor=int(d.get("out_minor") or 0),
                    balance_minor=int(d.get("balance_minor") or 0),
                    note=d.get("note"),
                )
            )
        except (ValueError, TypeError):
            continue

    warnings: list[ForecastWarning] = []
    for w in (data.get("warnings") or [])[:6]:
        try:
            warnings.append(
                ForecastWarning(
                    date=str(w.get("date") or ""),
                    severity=str(w.get("severity") or "low").lower(),
                    message=str(w.get("message") or ""),
                )
            )
        except (ValueError, TypeError):
            continue

    return ForecastResponse(
        starting_balance_minor=int(
            data.get("starting_balance_minor") or starting_balance
        ),
        daily=daily,
        warnings=warnings,
        summary=str(data.get("summary") or ""),
        history_days_used=HISTORY_DAYS,
        pending_orders_count=len(pend_rows),
    )


async def _gather_history() -> tuple[list, list, list, list]:
    rev_rows = await _last_n_day_revenue(HISTORY_DAYS)
    exp_rows = await _last_n_day_expenses(HISTORY_DAYS)
    pend_rows = await _pending_orders()
    cat_rows = await _expense_category_rollup(HISTORY_DAYS)
    return rev_rows, exp_rows, pend_rows, cat_rows


def _expand_scheduled(
    sched_rows: list[dict[str, Any]], today: date, horizon_days: int
) -> list[dict[str, Any]]:
    """Aktif scheduled ödemeleri occurrence listesine genişlet."""
    out: list[dict[str, Any]] = []
    horizon_end = today + timedelta(days=horizon_days)

    for s in sched_rows:
        rec = s.get("recurrence") or "MONTHLY"
        due_day = int(s.get("due_day") or 1)
        start_raw = s.get("start_date")
        end_raw = s.get("end_date")
        try:
            start = (
                datetime.fromisoformat(start_raw).date()
                if isinstance(start_raw, str)
                else start_raw
            )
        except (ValueError, TypeError):
            continue
        if not start:
            continue
        end = None
        if end_raw:
            try:
                end = (
                    datetime.fromisoformat(end_raw).date()
                    if isinstance(end_raw, str)
                    else end_raw
                )
            except (ValueError, TypeError):
                end = None

        limit = min(end, horizon_end) if end else horizon_end

        if rec == "ONE_TIME":
            if today <= start <= limit:
                out.append(_occurrence(s, start))
            continue

        cursor = start
        # Cursor `today`'a kadar sıçra
        i = 0
        while cursor < today and i < 600:
            cursor = _advance_date(cursor, rec, due_day)
            i += 1
        # `today..limit` aralığında topla
        i = 0
        while cursor <= limit and i < 600:
            if cursor >= today:
                out.append(_occurrence(s, cursor))
            cursor = _advance_date(cursor, rec, due_day)
            i += 1

    out.sort(key=lambda o: o["date"])
    return out


def _advance_date(d: date, rec: str, due_day: int) -> date:
    if rec == "WEEKLY":
        return d + timedelta(days=7)
    if rec == "QUARTERLY":
        return _shift_months(d, 3, due_day)
    if rec == "YEARLY":
        return _shift_months(d, 12, due_day)
    # MONTHLY default
    return _shift_months(d, 1, due_day)


def _shift_months(d: date, months: int, due_day: int) -> date:
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    # ay sonu güvenliği
    from calendar import monthrange

    last_of_month = monthrange(year, month)[1]
    day = max(1, min(due_day or d.day, last_of_month))
    return date(year, month, day)


def _occurrence(s: dict[str, Any], d: date) -> dict[str, Any]:
    return {
        "date": d.isoformat(),
        "name": s.get("name", ""),
        "category": s.get("category", "OTHER"),
        "amount": int(s.get("amount") or 0),
        "vendor": s.get("vendor"),
    }


def _fallback_forecast(
    *, starting_balance: int, rev_rows: list, exp_rows: list, pending_count: int
) -> ForecastResponse:
    """Gemini başarısız olursa ortalama bazlı basit forecast."""
    avg_daily_rev = (
        int(sum(int(r["gelir"] or 0) for r in rev_rows) / max(1, len(rev_rows)))
        if rev_rows
        else 0
    )
    avg_daily_exp = (
        int(sum(int(r["amount"] or 0) for r in exp_rows) / max(1, FORECAST_DAYS))
        if exp_rows
        else 0
    )

    daily = []
    balance = starting_balance
    today = date.today()
    for i in range(FORECAST_DAYS):
        d = today + timedelta(days=i)
        balance += avg_daily_rev - avg_daily_exp
        daily.append(
            ForecastDay(
                date=d.isoformat(),
                in_minor=avg_daily_rev,
                out_minor=avg_daily_exp,
                balance_minor=balance,
            )
        )

    return ForecastResponse(
        starting_balance_minor=starting_balance,
        daily=daily,
        warnings=[],
        summary="Yeterli veri yok, ortalama bazlı basit projeksiyon.",
        pending_orders_count=pending_count,
    )
