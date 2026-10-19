"""Write items to Supabase through its REST API."""

import os

import requests


def auth_headers(key: str) -> dict:
    """Headers that authenticate a request with a Supabase key.

    New-style keys (sb_publishable_..., sb_secret_...) aren't JWTs, so they only
    go in the apikey header. Legacy anon and service_role keys are JWTs and also
    go in Authorization as a Bearer token.
    """
    headers = {"apikey": key}
    if not key.startswith("sb_"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


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
            **auth_headers(key),
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return len(items)
