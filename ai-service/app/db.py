"""Read-only Postgres pool used by the natural-language query tool."""

import asyncio
import logging
from typing import Any

import asyncpg

from app.config import get_settings

log = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    """Lazy-initialised connection pool. The pool is shared across requests."""
    global _pool
    if _pool is not None:
        return _pool
    async with _pool_lock:
        if _pool is None:
            settings = get_settings()
            _pool = await asyncpg.create_pool(
                settings.readonly_database_url,
                min_size=1,
                max_size=4,
                command_timeout=settings.query_timeout_seconds,
            )
            log.info("Read-only Postgres pool initialised (max_size=4)")
    return _pool


async def fetch_rows(sql: str, max_rows: int) -> list[dict[str, Any]]:
    """Execute a SELECT and return list of dicts. Pool-managed connection."""
    pool = await get_pool()
    settings = get_settings()
    async with pool.acquire() as conn:
        records = await asyncio.wait_for(
            conn.fetch(sql),
            timeout=settings.query_timeout_seconds,
        )
    rows: list[dict[str, Any]] = []
    for r in records[:max_rows]:
        rows.append({k: _coerce(v) for k, v in dict(r).items()})
    return rows


def _coerce(v: Any) -> Any:
    """Make values JSON-serialisable: dates → iso, decimals → float, etc."""
    if v is None:
        return None
    # asyncpg already gives us python primitives for most types.
    # datetime, date, UUID need stringification for JSON.
    from datetime import date, datetime
    from decimal import Decimal
    from uuid import UUID

    if isinstance(v, datetime | date):
        return v.isoformat()
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, UUID):
        return str(v)
    return v
