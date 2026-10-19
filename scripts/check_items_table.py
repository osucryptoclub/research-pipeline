"""Check that the items table works and its security rules hold.

    python scripts/check_items_table.py

Steps:
  1. Save a test item with the service role key.
  2. Read it back with the anon (public) key.
  3. Try to insert, update, and delete with the anon key. All must fail.

Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY from .env.
This WRITES a test row, so only point it at your own test project, never the
club database unless a lead has approved it. Re-running it is safe: the test
row is upserted, not duplicated. Not run in CI because it needs the network.
"""

import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

TEST_ITEM = {
    "source_id": "archive-smoke-test",
    "url": "https://example.com/archive-smoke-test",
    "title": "Archive smoke test item",
    "summary": "Test row written by scripts/check_items_table.py. Not real data.",
    "published_at": "2026-10-13T12:00:00+00:00",
    "tags": ["test"],
    "raw": {"note": "written by scripts/check_items_table.py"},
}
MATCH_TEST_ITEM = {"source_id": f"eq.{TEST_ITEM['source_id']}", "url": f"eq.{TEST_ITEM['url']}"}


def auth_headers(key: str) -> dict:
    # New-style keys (sb_publishable_..., sb_secret_...) aren't JWTs and only go in
    # the apikey header. Legacy anon/service_role keys go in both.
    headers = {"apikey": key, "Content-Type": "application/json"}
    if not key.startswith("sb_"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY") if not os.environ.get(v)]
    if missing:
        print(f"Missing in .env: {', '.join(missing)}")
        return 1

    endpoint = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/items"
    service = auth_headers(os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    anon = auth_headers(os.environ["SUPABASE_ANON_KEY"])
    print(f"Checking {endpoint}\n")

    results = []

    def check(name: str, passed: bool, detail: str = "") -> None:
        results.append(passed)
        print(f"{'PASS' if passed else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))

    def read_test_item(headers: dict) -> list:
        resp = requests.get(endpoint, params={**MATCH_TEST_ITEM, "select": "*"}, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()

    # 1. Save with the service role key (same upsert the collectors use).
    resp = requests.post(
        endpoint,
        params={"on_conflict": "source_id,url"},
        json=[TEST_ITEM],
        headers={**service, "Prefer": "resolution=merge-duplicates,return=minimal"},
        timeout=30,
    )
    check("service key can save a test item", resp.ok, f"HTTP {resp.status_code}")
    if not resp.ok:
        print(f"      {resp.text}")
        return 1

    # 2. Read it back with the anon key.
    rows = read_test_item(anon)
    check("anon key can read the test item", len(rows) == 1, f"{len(rows)} row(s)")
    if len(rows) != 1:
        return 1
    row = rows[0]
    wrong = [f for f in ("title", "summary", "tags", "raw") if row.get(f) != TEST_ITEM[f]]
    check("fields came back unchanged", not wrong, f"mismatched: {', '.join(wrong)}" if wrong else "")
    check("collected_at was filled in automatically", bool(row.get("collected_at")))
    check("search column was generated", bool(row.get("search")))

    # 3a. Anon insert: RLS has no insert policy, so Postgres rejects it.
    blocked_url = TEST_ITEM["url"] + "-anon-insert"
    resp = requests.post(endpoint, json=[{**TEST_ITEM, "url": blocked_url}], headers=anon, timeout=30)
    check("anon key cannot insert", resp.status_code in (401, 403), f"HTTP {resp.status_code}")

    # 3b/3c. Anon update and delete don't error: RLS hides every row from them, so
    # they match nothing and report success. The real check is that the row is untouched.
    requests.patch(endpoint, params=MATCH_TEST_ITEM, json={"title": "changed by anon"}, headers=anon, timeout=30)
    after_update = read_test_item(service)
    check(
        "anon key cannot update",
        len(after_update) == 1 and after_update[0]["title"] == TEST_ITEM["title"],
    )

    requests.delete(endpoint, params=MATCH_TEST_ITEM, headers=anon, timeout=30)
    check("anon key cannot delete", len(read_test_item(service)) == 1)

    passed = sum(results)
    print(f"\n{passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
