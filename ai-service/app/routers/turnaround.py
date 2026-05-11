"""Turnaround plan — bakiye eksiye düşüyorsa AI'dan 3 aylık aksiyon planı al.

Endpoint mantığı:
1. Son 90 gün gelir/gider + aktif scheduled payment'ları topla
2. Önümüzdeki 90 günü kabaca projekte et (günlük ort. gelir - ort. ad-hoc gider
   - scheduled payment'lar dahil)
3. AI'a structured JSON sun: bakiye negatif mi, kategori dağılımı, hangi
   ödemeler en ağır basıyor
4. Gemini'den yapılandırılmış öneri al: acil kesintiler, gelir boost,
   reklamlar, 3 aylık milestone, borç sıfırlama timeline
5. Frontend grafiksel olarak gösterir (bar + line + timeline)
"""

import json
import logging
import re
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.db import fetch_rows
from app.llm import gemini
from app.routers.cashflow import _expand_scheduled

log = logging.getLogger(__name__)

router = APIRouter(prefix="/finance", tags=["finance"])

HISTORY_DAYS = 90
PROJECTION_DAYS = 90  # 3 ay


# ─── DB ─────────────────────────────────────────────────────────────────────


async def _hist_revenue(days: int) -> list[dict[str, Any]]:
    sql = f"""
    SELECT DATE("createdAt") AS d, COALESCE(SUM(total),0) AS gelir
    FROM "Order"
    WHERE "createdAt" >= NOW() - INTERVAL '{days} days'
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY DATE("createdAt")
    """
    return await fetch_rows(sql, days + 10)


async def _hist_expense_cat(days: int) -> list[dict[str, Any]]:
    sql = f"""
    SELECT category, COALESCE(SUM(amount),0) AS amount, COUNT(*) AS occ
    FROM "Expense"
    WHERE date >= NOW() - INTERVAL '{days} days'
    GROUP BY category
    ORDER BY amount DESC
    """
    return await fetch_rows(sql, 20)


async def _hist_expense_total(days: int) -> int:
    sql = f"""
    SELECT COALESCE(SUM(amount),0) AS toplam FROM "Expense"
    WHERE date >= NOW() - INTERVAL '{days} days'
    """
    rows = await fetch_rows(sql, 1)
    return int(rows[0]["toplam"]) if rows else 0


async def _active_scheduled() -> list[dict[str, Any]]:
    sql = """
    SELECT id, name, amount, category, recurrence, "dueDay" AS due_day,
           "startDate" AS start_date, "endDate" AS end_date, vendor
    FROM "ScheduledPayment" WHERE active = true
    """
    return await fetch_rows(sql, 100)


# ─── Pydantic ──────────────────────────────────────────────────────────────


class CategoryBar(BaseModel):
    category: str
    amount_minor: int
    pct: float


class MonthlyProjection(BaseModel):
    month_label: str  # "Mayıs", "Haziran", "Temmuz"
    revenue_minor: int
    expense_minor: int
    scheduled_minor: int  # bunlardan kaçı kesin scheduled
    balance_minor: int  # cumulative bakiye sonu
    balance_with_plan_minor: int  # AI önerisi uygulanırsa


class ActionItem(BaseModel):
    title: str
    description: str
    category: str  # CUT | BOOST | DELAY | RENEGOTIATE | MARKETING | OTHER
    impact_minor_monthly: int  # tahmini aylık etki (pozitif = kazanç/tasarruf)
    urgency: str  # high | medium | low
    week: int | None = None  # 1-12 timeline


class TurnaroundResponse(BaseModel):
    severity: str  # critical | warning | ok
    summary: str
    current_balance_minor: int
    projected_90day_balance_minor: int  # planlanmış bütçeye göre 90 gün sonu
    projected_with_plan_minor: int  # AI önerisi uygulanırsa 90 gün sonu
    category_bars: list[CategoryBar]
    monthly: list[MonthlyProjection]
    actions: list[ActionItem]


# ─── Prompt ────────────────────────────────────────────────────────────────


TURNAROUND_SYSTEM = """Sen bir finansal danışmansın. Türkiye'de küçük/orta
ölçekli bir e-ticaret mağazasına 3 aylık kurtarma planı hazırlıyorsun.

VERİLER:
- Mevcut bakiye, son 90 gün gelir/gider ortalaması
- Önümüzdeki 90 gün kesin ödemeler (maaş, kira, vergi, abonelik)
- Naive projeksiyon (gelir aynı kalırsa) — bakiye seyri
- Kategori bazında gider dağılımı

GÖREVİN: Eğer projeksiyon NEGATİF veya ZAR ZOR pozitifse,
gerçekçi aksiyonlarla 3 ay içinde dengeyi düzeltecek bir plan yaz.

ÇIKTI: SADECE JSON, başka metin yok:
{
  "severity": "critical" | "warning" | "ok",
  "summary": "<TR 2-3 cümle: mevcut durum + ana risk + 3 ay sonra hedef>",
  "projected_with_plan_minor": <int kuruş — plan uygulanırsa 90g sonu bakiye>,
  "monthly": [
    {
      "month_label": "<TR ay adı>",
      "balance_with_plan_minor": <int — plan uygulanırsa bu ay sonu bakiye>
    },
    ... 3 ay
  ],
  "actions": [
    {
      "title": "<TR kısa eylem başlığı, 4-7 kelime>",
      "description": "<TR 1-2 cümle somut talimat. Örnek: 'TRAVEL kategorisinde 2 ay zorunlu olmayan ziyaretleri ertele — aylık 12.000 TL tasarruf'>",
      "category": "CUT" | "BOOST" | "DELAY" | "RENEGOTIATE" | "MARKETING" | "OTHER",
      "impact_minor_monthly": <int kuruş — aylık pozitif etki tahmin>,
      "urgency": "high" | "medium" | "low",
      "week": <int 1-12, plan uygulanması gereken hafta>
    }
    // 4-7 aksiyon (acil + orta vadeli karışık)
  ]
}

KURALLAR:
1. ⚠️ Tüm tutarlar KURUŞ (minor unit). 1 TL = 100. 50.000 TL = 5_000_000.
2. Aksiyonlar SOMUT olsun: 'X kategorisinde Y TL kes', 'Z reklamına W TL yatır,
   tahmini X% lift'. Soyut tavsiye yasak ('giderlerinizi gözden geçirin' YOK).
3. Türkiye gerçekleri: maaş ve kira kesilemez, ama RENEGOTIATE olabilir
   (kira indirimi pazarlığı, çalışan saatleri). KDV/SGK ASLA ertelenmez.
4. Marketing aksiyonları için CTR/ROAS tahminleri makul: Instagram reklam
   1 TL → ~3-5 TL gelir (1. ay). Google Ads → ~4-6 TL gelir.
5. Pazarlama dili kullanma, kuru direktif yaz.
6. 'category' enum dışında değer YASAK. 'urgency' high/medium/low dışında YOK.
7. Plan uygulanırsa 3 ay sonu bakiye, mevcut projeksiyondan iyileşmiş olmalı."""


# ─── Helpers ───────────────────────────────────────────────────────────────


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


TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]


# ─── Endpoint ──────────────────────────────────────────────────────────────


@router.post("/turnaround-plan", response_model=TurnaroundResponse)
async def turnaround_plan() -> TurnaroundResponse:
    today = date.today()

    rev_rows = await _hist_revenue(HISTORY_DAYS)
    cat_rows = await _hist_expense_cat(HISTORY_DAYS)
    exp_total = await _hist_expense_total(HISTORY_DAYS)
    sched_rows = await _active_scheduled()

    total_rev_90 = sum(int(r["gelir"] or 0) for r in rev_rows)
    avg_daily_rev = total_rev_90 // max(1, HISTORY_DAYS)

    # ad-hoc daily expense (scheduled hariç tahmini, gerçek scheduled tarihte
    # düşeceği için)
    sched_monthly_total = sum(int(s["amount"] or 0) for s in sched_rows)
    # Son 90g toplamdan scheduled benzeri (PAYROLL/RENT) düşelim ad-hoc kalsın
    fixed_categories = {"PAYROLL", "RENT"}
    fixed_total = sum(
        int(r["amount"] or 0) for r in cat_rows if r["category"] in fixed_categories
    )
    adhoc_total = max(0, exp_total - fixed_total)
    adhoc_daily = adhoc_total // max(1, HISTORY_DAYS)

    starting_balance = total_rev_90 - exp_total

    # 90-day expand of scheduled
    sched_occ = _expand_scheduled(sched_rows, today, PROJECTION_DAYS)

    # Build monthly projection (naive — no plan yet)
    monthly_no_plan: list[dict[str, Any]] = []
    cumulative = starting_balance
    for m in range(3):
        m_start = today + timedelta(days=m * 30)
        m_end = today + timedelta(days=(m + 1) * 30)
        m_label = TR_MONTHS[((today.month - 1 + m) % 12)]
        m_rev = avg_daily_rev * 30
        m_adhoc = adhoc_daily * 30
        m_sched = sum(
            o["amount"] for o in sched_occ
            if m_start.isoformat() <= o["date"] < m_end.isoformat()
        )
        cumulative += m_rev - m_adhoc - m_sched
        monthly_no_plan.append({
            "month_label": m_label,
            "revenue_minor": m_rev,
            "expense_minor": m_adhoc,
            "scheduled_minor": m_sched,
            "balance_minor": cumulative,
        })

    projected_90 = monthly_no_plan[-1]["balance_minor"] if monthly_no_plan else 0

    # Severity
    if projected_90 < 0:
        severity = "critical"
    elif projected_90 < (avg_daily_rev * 14):  # 2 haftalık buffer'dan az
        severity = "warning"
    else:
        severity = "ok"

    # Category bars
    total_cat = sum(int(r["amount"] or 0) for r in cat_rows) or 1
    bars = [
        CategoryBar(
            category=r["category"],
            amount_minor=int(r["amount"] or 0),
            pct=round(int(r["amount"] or 0) * 100 / total_cat, 1),
        )
        for r in cat_rows[:8]
    ]

    # Prepare prompt
    lines = [
        f"BUGÜN: {today.isoformat()}",
        f"MEVCUT BAKİYE (son 90g net): {starting_balance / 100:.0f} TL",
        f"SON 90G GELİR: {total_rev_90 / 100:.0f} TL "
        f"(günlük ort. {avg_daily_rev / 100:.0f} TL)",
        f"SON 90G GİDER: {exp_total / 100:.0f} TL",
        f"AKTİF SCHEDULED ÖDEME SAYISI: {len(sched_rows)} "
        f"(toplam aylık: {sched_monthly_total / 100:.0f} TL)",
        "",
        "KATEGORİ BAZINDA SON 90G GİDER:",
    ]
    for r in cat_rows:
        lines.append(
            f"  {r['category']}: {int(r['amount'] or 0) / 100:.0f} TL "
            f"({r['occ']} kayıt)"
        )
    lines.append("")
    lines.append("3 AYLIK NAIVE PROJEKSİYON (gelir/gider aynı kalırsa):")
    for m in monthly_no_plan:
        lines.append(
            f"  {m['month_label']}: gelir {m['revenue_minor'] / 100:.0f} TL, "
            f"ad-hoc gider {m['expense_minor'] / 100:.0f} TL, "
            f"kesin ödeme {m['scheduled_minor'] / 100:.0f} TL → "
            f"bakiye sonu {m['balance_minor'] / 100:.0f} TL"
        )
    if sched_rows:
        lines.append("")
        lines.append("KESİN AYLIK ÖDEMELER:")
        for s in sched_rows[:15]:
            lines.append(
                f"  - {s['name']} ({s['category']}, ayın {s['due_day']}.'i): "
                f"{int(s['amount'] or 0) / 100:.0f} TL"
            )
    lines.append("")
    lines.append(
        "Bu mağaza için 3 aylık kurtarma planı üret. "
        f"Severity şu an: {severity}. JSON çıktı ver."
    )

    prompt = "\n".join(lines)
    text = await gemini.generate(prompt, system=TURNAROUND_SYSTEM, temperature=0.5)
    data = _extract_json(text)

    # AI çıktısı yoksa fallback: sadece naive projeksiyon, action listesi yok
    if not data:
        return TurnaroundResponse(
            severity=severity,
            summary="AI plan üretilemedi. Manuel inceleme öner.",
            current_balance_minor=starting_balance,
            projected_90day_balance_minor=projected_90,
            projected_with_plan_minor=projected_90,
            category_bars=bars,
            monthly=[
                MonthlyProjection(
                    month_label=m["month_label"],
                    revenue_minor=m["revenue_minor"],
                    expense_minor=m["expense_minor"],
                    scheduled_minor=m["scheduled_minor"],
                    balance_minor=m["balance_minor"],
                    balance_with_plan_minor=m["balance_minor"],
                )
                for m in monthly_no_plan
            ],
            actions=[],
        )

    # Merge AI's monthly improvement into our naive projection
    ai_monthly = data.get("monthly") or []
    monthly_merged: list[MonthlyProjection] = []
    for i, m in enumerate(monthly_no_plan):
        ai_row = ai_monthly[i] if i < len(ai_monthly) else {}
        balance_with_plan = int(
            ai_row.get("balance_with_plan_minor") or m["balance_minor"]
        )
        monthly_merged.append(
            MonthlyProjection(
                month_label=m["month_label"],
                revenue_minor=m["revenue_minor"],
                expense_minor=m["expense_minor"],
                scheduled_minor=m["scheduled_minor"],
                balance_minor=m["balance_minor"],
                balance_with_plan_minor=balance_with_plan,
            )
        )

    actions: list[ActionItem] = []
    for a in (data.get("actions") or [])[:10]:
        try:
            actions.append(
                ActionItem(
                    title=str(a.get("title", ""))[:120],
                    description=str(a.get("description", ""))[:400],
                    category=str(a.get("category") or "OTHER").upper(),
                    impact_minor_monthly=int(a.get("impact_minor_monthly") or 0),
                    urgency=str(a.get("urgency") or "medium").lower(),
                    week=(
                        int(a["week"])
                        if a.get("week") is not None
                        and str(a["week"]).strip().isdigit()
                        else None
                    ),
                )
            )
        except (ValueError, TypeError):
            continue

    return TurnaroundResponse(
        severity=str(data.get("severity") or severity).lower(),
        summary=str(data.get("summary") or ""),
        current_balance_minor=starting_balance,
        projected_90day_balance_minor=projected_90,
        projected_with_plan_minor=int(
            data.get("projected_with_plan_minor")
            or (monthly_merged[-1].balance_with_plan_minor if monthly_merged else 0)
        ),
        category_bars=bars,
        monthly=monthly_merged,
        actions=actions,
    )
