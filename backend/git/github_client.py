import os
from github import Github
from dotenv import load_dotenv

load_dotenv()

_gh = Github(os.getenv("GITHUB_TOKEN"))


def fetch_pr_files(pr_url: str) -> list[dict]:
    try:
        pr_url = pr_url.strip()
        if not pr_url.startswith("http"):
            pr_url = "https://" + pr_url

        parts = pr_url.rstrip("/").split("/")
        if len(parts) < 7:
            raise ValueError(f"Invalid PR URL format: {pr_url}")

        owner     = parts[3]
        repo_name = parts[4]
        pr_number = int(parts[6])

    except (IndexError, ValueError) as e:
        raise ValueError(f"Could not parse PR URL '{pr_url}': {e}")

    try:
        repo = _gh.get_repo(f"{owner}/{repo_name}")
        pr   = repo.get_pull(pr_number)
    except Exception as e:
        raise ValueError(f"Could not fetch PR from GitHub: {e}")

    files = []
    for f in pr.get_files():
        if f.patch is None:
            continue  # skip binary/deleted files

        try:
            # ✅ Fetch actual file content at the PR's head commit
            file_content = repo.get_contents(f.filename, ref=pr.head.sha)
            actual_code = file_content.decoded_content.decode("utf-8")
        except Exception:
            # ✅ Fallback: strip diff markers from patch if file fetch fails
            lines = f.patch.splitlines()
            actual_code = "\n".join(
                line[1:] for line in lines
                if line.startswith("+") and not line.startswith("+++")
            )

        if not actual_code.strip():
            continue

        files.append({
            "filename": f.filename,
            "content": actual_code,  # ✅ Now sends real code, not diff
        })

    if not files:
        raise ValueError("No reviewable files found in this PR (may be binary or empty)")

    return files