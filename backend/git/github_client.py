import os
from github import Github
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

_gh = Github(os.getenv("GITHUB_TOKEN"))


def fetch_pr_files(pr_url: str) -> list[dict]:
    """
    Given a GitHub PR URL like:
      https://github.com/owner/repo/pull/42
    Return a list of dicts: {filename, content}
    """
    try:
        # Clean the URL
        pr_url = pr_url.strip()
        if not pr_url.startswith("http"):
            pr_url = "https://" + pr_url

        # Parse safely
        parts = pr_url.rstrip("/").split("/")

        # Validate minimum length
        if len(parts) < 7:
            raise ValueError(f"Invalid PR URL format: {pr_url}")

        owner     = parts[3]
        repo_name = parts[4]
        # parts[5] should be 'pull'
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
        files.append({
            "filename": f.filename,
            "content": f.patch,
        })

    if not files:
        raise ValueError("No reviewable files found in this PR (may be binary or empty)")

    return files