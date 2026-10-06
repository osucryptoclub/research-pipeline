from pipeline.config import approved_sources, load_config
from pipeline.tagging import tag_item
from pipeline.types.rss import parse

TOPICS = {
    "stablecoins": {"keywords": ["stablecoin", "USDC"]},
    "regulation": {"keywords": ["SEC"]},
}

SAMPLE_FEED = """<?xml version="1.0"?>
<rss version="2.0"><channel><title>Test</title>
<item><title>SEC proposes stablecoin rule</title><link>https://example.com/a</link>
<description>New rules for USDC issuers.</description><pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>No link here</title></item>
</channel></rss>"""


def test_tags_match_every_topic():
    assert tag_item("SEC proposes stablecoin rule", None, TOPICS, []) == ["regulation", "stablecoins"]


def test_keywords_match_whole_words_only():
    assert tag_item("Second quarter results", None, TOPICS, []) == []


def test_source_tags_always_applied():
    assert tag_item("Unrelated", None, TOPICS, ["regulation"]) == ["regulation"]


def test_rss_parse_skips_entries_without_links():
    items = parse(SAMPLE_FEED, "test")
    assert len(items) == 1
    assert items[0]["url"] == "https://example.com/a"
    assert items[0]["published_at"].startswith("2026-10-05")


def test_real_config_loads():
    config = load_config()
    assert "topics" in config
    assert isinstance(approved_sources(config), list)
