"""
Schema manager — introspects the SQLite database and returns
structured schema info for both the Gemini prompt and the frontend.
"""

import sqlite3
import os
from typing import Dict, List, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_schema() -> Dict[str, Any]:
    """
    Returns full schema: table names → column list with types.
    Also returns a DDL string for injection into the Gemini prompt.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
    tables = [row["name"] for row in cur.fetchall()]

    schema_data: Dict[str, List[Dict]] = {}
    ddl_parts: List[str] = []

    for table in tables:
        cur.execute(f"PRAGMA table_info({table});")
        columns = cur.fetchall()
        schema_data[table] = [
            {
                "cid": col["cid"],
                "name": col["name"],
                "type": col["type"],
                "notnull": bool(col["notnull"]),
                "pk": bool(col["pk"]),
            }
            for col in columns
        ]

        # Build DDL snippet
        col_defs = []
        for col in schema_data[table]:
            flags = []
            if col["pk"]:
                flags.append("PRIMARY KEY")
            if col["notnull"]:
                flags.append("NOT NULL")
            col_defs.append(f"  {col['name']} {col['type']} {' '.join(flags)}".strip())
        ddl_parts.append(f"CREATE TABLE {table} (\n" + ",\n".join(col_defs) + "\n);")

    # Row counts
    row_counts: Dict[str, int] = {}
    for table in tables:
        cur.execute(f"SELECT COUNT(*) as cnt FROM {table};")
        row_counts[table] = cur.fetchone()["cnt"]

    conn.close()

    return {
        "tables": schema_data,
        "ddl": "\n\n".join(ddl_parts),
        "row_counts": row_counts,
    }


def validate_tables_exist(sql: str) -> bool:
    """Check all referenced tables in sql exist in the schema."""
    schema = get_schema()
    existing = set(schema["tables"].keys())
    import re
    # crude FROM/JOIN table extraction
    referenced = set(re.findall(r"(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)", sql, re.IGNORECASE))
    return referenced.issubset(existing)
