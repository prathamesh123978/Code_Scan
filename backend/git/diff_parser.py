def extract_added_lines(patch: str) -> str:
    """From a git diff patch, extract only the added lines (lines starting with '+')."""
    print(f"[DEBUG] Patch received (first 300 chars): {patch[:300] if patch else 'EMPTY/NONE'}")
    
    if not patch:
        return ""
    
    lines = patch.splitlines()
    added = [l[1:] for l in lines if l.startswith("+") and not l.startswith("+++")]
    result = "\n".join(added)
    
    print(f"[DEBUG] Extracted {len(added)} added lines")
    return result