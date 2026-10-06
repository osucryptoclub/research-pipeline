"""One module per source type. Each exposes collect(source, user_agent) -> list[dict]."""

from . import rss

COLLECTORS = {
    "rss": rss.collect,
}
