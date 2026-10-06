"""Check config/sources.yaml for mistakes. Runs in CI on every PR."""

import re
import sys
from pathlib import Path

import yaml

CONFIG = Path(__file__).resolve().parents[1] / "config" / "sources.yaml"
SUPPORTED_TYPES = {"rss"}
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def main() -> int:
    config = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    errors = []

    topics = config.get("topics") or {}
    for tid, topic in topics.items():
        if not ID_RE.match(tid):
            errors.append(f"topic {tid!r}: id must be lowercase with dashes")
        if not topic.get("keywords"):
            errors.append(f"topic {tid!r}: needs at least one keyword")

    seen = set()
    for i, s in enumerate(config.get("sources") or []):
        label = s.get("id", f"sources[{i}]")
        for field in ("id", "name", "type", "url", "approved"):
            if field not in s:
                errors.append(f"{label}: missing {field}")
        sid = s.get("id", "")
        if sid and not ID_RE.match(sid):
            errors.append(f"{label}: id must be lowercase with dashes")
        if sid in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(sid)
        if s.get("type") and s["type"] not in SUPPORTED_TYPES:
            errors.append(f"{label}: type {s['type']!r} not supported yet ({', '.join(sorted(SUPPORTED_TYPES))})")
        if s.get("url") and not str(s["url"]).startswith("https://"):
            errors.append(f"{label}: url must start with https://")
        for tag in s.get("tags") or []:
            if tag not in topics:
                errors.append(f"{label}: tag {tag!r} is not a topic")

    if errors:
        print("config/sources.yaml has problems:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"config OK: {len(topics)} topics, {len(seen)} sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
