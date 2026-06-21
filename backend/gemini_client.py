"""
Gemini Flash client — schema-aware text-to-SQL inference.
Uses the generativelanguage REST API with structured JSON output.
"""

import os
import json
import re
import requests
from typing import Dict, Any
from dotenv import load_dotenv

from pydantic import BaseModel, field_validator

load_dotenv()  # loads .env from project root

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)


# ---------- Typed output contract ----------
class GeminiSQLResponse(BaseModel):
    sql: str
    explanation: str
    confidence: float

    @field_validator("sql")
    @classmethod
    def sql_must_be_select(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped.upper().startswith("SELECT"):
            raise ValueError(f"Gemini returned non-SELECT SQL: {stripped[:60]}")
        return stripped

    @field_validator("confidence")
    @classmethod
    def confidence_range(cls, v: float) -> float:
        return max(0.0, min(1.0, float(v)))


# ---------- System prompt builder ----------
SYSTEM_PROMPT_TEMPLATE = """\
You are an expert SQL query generator for SQLite databases.
Given a user's natural language question, generate a precise SQLite SELECT query.

DATABASE SCHEMA:
{ddl}

RULES:
1. Only generate SELECT queries — never INSERT, UPDATE, DELETE, DROP, or DDL.
2. Use exact table and column names from the schema above.
3. Prefer readable aliases (e.g., e.name AS employee_name).
4. For date comparisons use ISO format 'YYYY-MM-DD'.
5. Always LIMIT results to at most 100 rows unless the user requests aggregates.
6. Return ONLY valid JSON with exactly these keys:
   {{"sql": "<the SQL query>", "explanation": "<plain English explanation>", "confidence": <0.0-1.0>}}
7. Do NOT include markdown code fences, backticks, or any text outside the JSON object.
"""


def generate_sql(natural_language: str, ddl: str) -> GeminiSQLResponse:
    """
    Calls Gemini Flash with schema-aware prompt engineering.
    Returns a validated GeminiSQLResponse.
    """
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(ddl=ddl)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": system_prompt}],
            },
            {
                "role": "model",
                "parts": [{"text": "Understood. I will generate only valid SQLite SELECT queries and return pure JSON."}],
            },
            {
                "role": "user",
                "parts": [{"text": f"Question: {natural_language}"}],
            },
        ],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.95,
            "maxOutputTokens": 512,
            "responseMimeType": "application/json",
        },
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }

    response = requests.post(GEMINI_ENDPOINT, json=payload, headers=headers, timeout=30)
    response.raise_for_status()

    data = response.json()

    # Extract text content from Gemini response
    try:
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Gemini response structure: {e}\nRaw: {json.dumps(data)[:500]}")

    # Strip potential markdown code fences
    raw_text = raw_text.strip()
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini did not return valid JSON: {e}\nRaw output: {raw_text[:300]}")

    return GeminiSQLResponse(**parsed)
