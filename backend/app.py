"""
Flask application for the LLM Text-to-SQL Query Engine.
"""

import time
import sqlite3
from collections import deque
from typing import Any, Dict, List

from flask import Flask, request, jsonify
from flask_cors import CORS

import schema_manager
import query_validator
import gemini_client
from sample_db import seed_database, DB_PATH

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# In-memory query history (last 20)
_history: deque = deque(maxlen=20)


# ── Helpers ──────────────────────────────────────────────────────────────────
def execute_sql(sql: str) -> Dict[str, Any]:
    """Execute a validated SELECT query and return columns + rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description] if cur.description else []
        return {
            "columns": columns,
            "rows": [dict(row) for row in rows],
            "row_count": len(rows),
        }
    finally:
        conn.close()


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "gemini-3.5-flash"})


@app.route("/api/schema", methods=["GET"])
def get_schema():
    try:
        schema = schema_manager.get_schema()
        return jsonify({"success": True, "schema": schema})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/query", methods=["POST"])
def run_query():
    body = request.get_json(force=True)
    question: str = body.get("question", "").strip()

    if not question:
        return jsonify({"success": False, "error": "Question is required."}), 400

    start_time = time.monotonic()

    try:
        # 1. Get schema for prompt injection
        schema = schema_manager.get_schema()
        ddl = schema["ddl"]

        # 2. Call Gemini to generate SQL
        gemini_result = gemini_client.generate_sql(question, ddl)

        # 3. Validate SQL safety
        is_valid, err_msg = query_validator.validate_sql(gemini_result.sql)
        if not is_valid:
            return jsonify({"success": False, "error": f"SQL validation failed: {err_msg}"}), 400

        # 4. Additional: check tables exist
        if not schema_manager.validate_tables_exist(gemini_result.sql):
            return jsonify({"success": False, "error": "Generated SQL references non-existent tables."}), 400

        # 5. Execute query
        results = execute_sql(gemini_result.sql)

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)

        response_data = {
            "success": True,
            "sql": gemini_result.sql,
            "explanation": gemini_result.explanation,
            "confidence": gemini_result.confidence,
            "results": results,
            "elapsed_ms": elapsed_ms,
        }

        # Store in history
        _history.appendleft({
            "question": question,
            "sql": gemini_result.sql,
            "row_count": results["row_count"],
            "elapsed_ms": elapsed_ms,
            "confidence": gemini_result.confidence,
        })

        return jsonify(response_data)

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 422
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal error: {str(e)}"}), 500


@app.route("/api/history", methods=["GET"])
def get_history():
    return jsonify({"success": True, "history": list(_history)})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Seed DB on startup if it doesn't exist
    import os
    if not os.path.exists(DB_PATH):
        print("[INIT] Seeding database...")
        seed_database()
    else:
        print(f"[INIT] Using existing database at {DB_PATH}")

    app.run(host="0.0.0.0", port=5000, debug=True)
