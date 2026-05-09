"""SQL safety guard for the query_database tool.

Read-only Postgres user is the strongest line of defence — even if the
guard misses something, the database refuses anything other than SELECT.
This module is a fast pre-check so we can return a friendly error before
hitting the wire, and to keep the query shape predictable (single statement,
LIMIT enforced, no transaction control, etc.).
"""

import re

# Words that imply DDL/DML/transaction control. Their presence anywhere in
# the trimmed SQL triggers refusal.
FORBIDDEN_PATTERN = re.compile(
    r"\b(insert|update|delete|drop|truncate|create|alter|grant|revoke|"
    r"comment|copy|vacuum|reindex|cluster|begin|commit|rollback|savepoint|"
    r"set\s+role|set\s+session|listen|notify|do|call|execute|prepare)\b",
    re.IGNORECASE,
)

# Comment markers that could hide forbidden tokens.
COMMENT_PATTERN = re.compile(r"(--[^\n]*|/\*.*?\*/)", re.DOTALL)


class QueryRefused(Exception):
    """Raised when the query is rejected before reaching Postgres."""


def sanitise(sql: str, max_rows: int) -> str:
    """Validate and normalise. Returns the exact SQL we'll send to Postgres.

    Rules:
      - Strip comments first so they can't smuggle keywords.
      - Single statement only (no `;` except optional trailing).
      - Must start with SELECT or WITH.
      - No DDL/DML/transaction control keywords anywhere.
      - LIMIT auto-injected when the model forgot one.
    """
    no_comments = COMMENT_PATTERN.sub(" ", sql).strip()
    if not no_comments:
        raise QueryRefused("Boş SQL.")

    # Drop a single trailing semicolon, refuse if there are more.
    stripped = no_comments.rstrip(";").rstrip()
    if ";" in stripped:
        raise QueryRefused("Tek seferde tek SELECT çalıştırabilirsin.")

    head_match = re.match(r"^\s*(\w+)", stripped, re.IGNORECASE)
    if not head_match:
        raise QueryRefused("SQL parse edilemedi.")
    head = head_match.group(1).lower()
    if head not in {"select", "with"}:
        raise QueryRefused(f"Sadece SELECT/WITH desteklenir, '{head_match.group(1)}' verildi.")

    if FORBIDDEN_PATTERN.search(stripped):
        raise QueryRefused("Sorguda yazma/şema değiştirme anahtar kelimesi var.")

    # Inject LIMIT if missing. We add an outer LIMIT so even subqueries
    # without limits don't pull massive sets.
    if not re.search(r"\blimit\s+\d+\s*$", stripped, re.IGNORECASE):
        stripped = f"SELECT * FROM ({stripped}) AS _capped LIMIT {max_rows}"

    return stripped
