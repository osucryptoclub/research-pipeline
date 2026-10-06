"""Tag items with every topic they touch."""

import re
from functools import lru_cache


@lru_cache(maxsize=None)
def _pattern(keyword: str) -> re.Pattern:
    # Whole-word match, so "SEC" doesn't tag "second" and "AI" doesn't tag "chain".
    return re.compile(rf"\b{re.escape(keyword.lower())}\b")


def tag_item(title: str | None, summary: str | None, topics: dict, source_tags: list[str]) -> list[str]:
    text = f"{title or ''} {summary or ''}".lower()
    tags = set(source_tags or [])
    for topic_id, topic in topics.items():
        if any(_pattern(kw).search(text) for kw in topic.get("keywords", [])):
            tags.add(topic_id)
    return sorted(tags)
