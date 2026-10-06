"""Write items to Supabase through its REST API."""

import os

import requests


def insert_items(items: list[dict]) -> int:
    """Insert items, skipping any (source_id, url) already in the archive. Returns rows sent."""
    if not items:
        return 0
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    resp = requests.post(
        f"{url}/rest/v1/items?on_conflict=source_id,url",
        json=items,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return len(items)
