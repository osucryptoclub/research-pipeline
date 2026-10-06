"""Run every approved source once.

    python run.py              collect and write to Supabase
    python run.py --dry-run    collect and print, no database needed
    python run.py --source X   run only source X (approved or not, for testing)
"""

import argparse
import json
import os
import sys

from dotenv import load_dotenv

from pipeline.config import approved_sources, load_config
from pipeline.db import insert_items
from pipeline.tagging import tag_item
from pipeline.types import COLLECTORS


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--source", help="run a single source id")
    args = parser.parse_args()

    config = load_config()
    topics = config.get("topics", {})
    if args.source:
        sources = [s for s in config.get("sources", []) if s["id"] == args.source]
    else:
        sources = approved_sources(config)

    if not sources:
        print("No sources to run. Approve one in config/sources.yaml or pass --source.")
        return 0

    contact = os.environ.get("CONTACT_EMAIL", "unset")
    user_agent = f"OSU Crypto Club research-pipeline ({contact})"

    failures = 0
    for source in sources:
        collect = COLLECTORS.get(source["type"])
        if collect is None:
            print(f"[{source['id']}] unknown type {source['type']!r}, skipping")
            failures += 1
            continue
        try:
            items = collect(source, user_agent)
            for item in items:
                item["tags"] = tag_item(item["title"], item["summary"], topics, source.get("tags", []))
            if args.dry_run:
                print(json.dumps(items[:3], indent=2, default=str))
                print(f"[{source['id']}] {len(items)} items (dry run, first 3 shown)")
            else:
                sent = insert_items(items)
                print(f"[{source['id']}] sent {sent} items")
        except Exception as e:  # one bad source shouldn't stop the rest
            print(f"[{source['id']}] FAILED: {e}")
            failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
