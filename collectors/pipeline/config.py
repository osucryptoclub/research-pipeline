"""Load config/sources.yaml."""

from pathlib import Path

import yaml

CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "sources.yaml"


def load_config(path: Path = CONFIG_PATH) -> dict:
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def approved_sources(config: dict) -> list[dict]:
    return [s for s in config.get("sources", []) if s.get("approved") is True]
