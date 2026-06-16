import json
import logging
from llm.groq_client import call_groq
from llm.prompt_builder import build_review_prompt, build_system_prompt
from analyzer.code_parser import chunk_code

logger = logging.getLogger(__name__)


def analyze_code(code: str, language: str = "auto") -> dict:
    chunks = chunk_code(code)
    all_bugs = []
    all_smells = []
    all_security = []
    all_performance = []
    scores = []
    summaries = []

    for chunk in chunks:
        result = _review_chunk(chunk, language)
        all_bugs.extend(result.get("bugs", []))
        all_smells.extend(result.get("code_smells", []))
        all_security.extend(result.get("security_issues", []))
        all_performance.extend(result.get("performance_issues", []))
        if result.get("quality_score") is not None:
            scores.append(result["quality_score"])
        if result.get("summary"):
            summaries.append(result["summary"])

    avg_score = int(sum(scores) / len(scores)) if scores else 50

    return {
        "bugs": all_bugs,
        "code_smells": all_smells,
        "security_issues": all_security,
        "performance_issues": all_performance,
        "quality_score": avg_score,
        "summary": " ".join(summaries),
    }


def _review_chunk(code: str, language: str) -> dict:
    prompt = build_review_prompt(code, language)
    system = build_system_prompt()
    raw = call_groq(prompt, system)

    # Strip markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip().rstrip("```").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # ✅ Log the actual Groq response so you can debug
        logger.error(f"JSON parse failed: {e}")
        logger.error(f"Raw Groq response was:\n{raw}")
        print(f"[DEBUG] Groq raw response:\n{raw}")  # visible in terminal immediately

        return {
            "bugs": [],
            "code_smells": [],
            "security_issues": [],
            "performance_issues": [],
            "quality_score": 50,
            "summary": f"Parse error – raw response: {raw[:300]}",
        }