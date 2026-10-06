"""Collector for RSS and Atom feeds."""

from datetime import datetime, timezone
from time import struct_time

import feedparser
import requests


def _to_iso(t: struct_time | None) -> str | None:
    if not t:
        return None
    return datetime(*t[:6], tzinfo=timezone.utc).isoformat()


def parse(feed_text: str, source_id: str) -> list[dict]:
    feed = feedparser.parse(feed_text)
    items = []
    for entry in feed.entries:
        link = entry.get("link")
        if not link:
            continue
        items.append(
            {
                "source_id": source_id,
                "url": link,
                "title": entry.get("title"),
                "summary": entry.get("summary"),
                "published_at": _to_iso(entry.get("published_parsed") or entry.get("updated_parsed")),
                "raw": {k: str(v) for k, v in entry.items() if isinstance(v, (str, int, float))},
            }
        )
    return items


def collect(source: dict, user_agent: str) -> list[dict]:
    resp = requests.get(source["url"], headers={"User-Agent": user_agent}, timeout=30)
    resp.raise_for_status()
    return parse(resp.text, source["id"])
