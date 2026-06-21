"""
SQL query validation layer — enforces SELECT-only safety rules.
"""

import re
from typing import Tuple


# Dangerous keywords that must not appear anywhere
_BLOCKED_PATTERNS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
    r"\bALTER\b", r"\bCREATE\b", r"\bTRUNCATE\b", r"\bEXEC\b",
    r"\bEXECUTE\b", r"\bGRANT\b", r"\bREVOKE\b", r"\bATTACH\b",
    r"\bDETACH\b", r"\bPRAGMA\b", r"--", r"/\*", r"\*/"
]

_MAX_QUERY_LENGTH = 2000


def validate_sql(sql: str) -> Tuple[bool, str]:
    """
    Validates a SQL string for safety.

    Returns:
        (is_valid, error_message)
    """
    if not sql or not sql.strip():
        return False, "Empty SQL query."

    stripped = sql.strip()

    if len(stripped) > _MAX_QUERY_LENGTH:
        return False, f"Query too long ({len(stripped)} chars). Max: {_MAX_QUERY_LENGTH}."

    # Must start with SELECT
    first_word = stripped.split()[0].upper()
    if first_word != "SELECT":
        return False, f"Only SELECT queries are allowed. Got: '{first_word}'."

    # Check for blocked patterns
    upper_sql = stripped.upper()
    for pattern in _BLOCKED_PATTERNS:
        if re.search(pattern, upper_sql, re.IGNORECASE):
            keyword = pattern.replace(r"\b", "").replace("\\b", "")
            return False, f"Blocked keyword or pattern detected: '{keyword}'."

    # Semicolon injection guard: only allow a single statement
    statements = [s.strip() for s in stripped.split(";") if s.strip()]
    if len(statements) > 1:
        return False, "Multiple SQL statements are not allowed."

    return True, ""
