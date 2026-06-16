from fastapi import APIRouter, HTTPException
from api.models import GithubReviewRequest
from git.github_client import fetch_pr_files
from analyzer.bug_detector import analyze_code
from analyzer.code_parser import detect_language
from database.connection import get_db
from database.schemas import review_document

router = APIRouter()


@router.post("/review/github")
async def review_github_pr(request: GithubReviewRequest):
    try:
        files = fetch_pr_files(request.pr_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PR: {str(e)}")

    print(f"[DEBUG] Total files fetched: {len(files)}")

    if not files:
        raise HTTPException(status_code=404, detail="No reviewable files found in PR")

    all_results = []

    for f in files:
        code = f["content"]
        print(f"[DEBUG] File: {f['filename']}")
        print(f"[DEBUG] Code length: {len(code)}")
        print(f"[DEBUG] Code preview:\n{code[:500]}")

        if not code.strip():
            print("[DEBUG] Skipping — empty code")
            continue

        language = detect_language(f["filename"])
        print(f"[DEBUG] Language: {language}")

        result = analyze_code(code, language)
        print(f"[DEBUG] Result: {result}")

        result["filename"] = f["filename"]
        all_results.append(result)

        try:
            db = get_db()
            if db is not None:
                doc = review_document(code, language, result, source="github")
                doc["pr_url"] = request.pr_url
                doc["filename"] = f["filename"]
                await db.reviews.insert_one(doc)
        except Exception:
            pass

    print(f"[DEBUG] all_results: {all_results}")
    return {"pr_url": request.pr_url, "files_reviewed": len(all_results), "results": all_results}