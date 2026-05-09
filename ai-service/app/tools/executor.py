"""Tool execution: Gemini'nin function call'larını çalıştırma katmanı.

Two tools:
  - query_database → asyncpg ile read-only DSN üzerinden SELECT
  - render_chart → echoed back, frontend tarafında render edilir
"""

import asyncio
import logging
from typing import Any

from app.config import get_settings
from app.db import fetch_rows
from app.tools.query import QueryRefused, sanitise

log = logging.getLogger(__name__)


async def execute_tool(name: str, args: dict[str, Any]) -> dict[str, Any]:
    if name == "query_database":
        return await _query_database(args)
    if name == "render_chart":
        return _render_chart(args)
    return {"error": f"Bilinmeyen tool: {name}"}


def _render_chart(args: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "chart",
        "type": args.get("type", "bar"),
        "title": args.get("title", ""),
        "labels": args.get("labels", []),
        "values": args.get("values", []),
        "unit": args.get("unit"),
    }


async def _query_database(args: dict[str, Any]) -> dict[str, Any]:
    sql = str(args.get("sql", "")).strip()
    settings = get_settings()

    try:
        prepared = sanitise(sql, max_rows=settings.query_max_rows)
    except QueryRefused as err:
        return {"error": f"Sorgu reddedildi: {err}"}

    try:
        rows = await fetch_rows(prepared, max_rows=settings.query_max_rows)
    except asyncio.TimeoutError:
        return {
            "error": (
                f"Sorgu {settings.query_timeout_seconds:.0f}s zaman aşımı — "
                "filtreyi daralt veya LIMIT azalt."
            )
        }
    except Exception as err:  # noqa: BLE001
        # asyncpg specific errors get reported back to the model so it can
        # retry with a corrected query.
        log.warning("query_database failed: %s", err)
        return {"error": f"Postgres hatası: {err.__class__.__name__}: {err}"}

    return {
        "row_count": len(rows),
        "rows": rows,
        "executed_sql": prepared,
    }
