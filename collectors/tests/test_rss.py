"""Tests for HTML cleanup of summaries (issue #34)."""

from pathlib import Path

import pytest

from pipeline.text import clean_html
from pipeline.types.rss import parse

FIXTURES = Path(__file__).parent / "fixtures"


def _feed_with_summary(summary: str) -> str:
    """A one-item RSS feed whose <description> is `summary`, passed through untouched."""
    return (
        '<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>'
        "<item><title>SEC &amp; CFTC</title><link>https://example.com/a</link>"
        f"<description><![CDATA[{summary}]]></description></item></channel></rss>"
    )


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        # Tags are removed, including links and their attributes.
        (
            "<p>The SEC proposed <a href='https://x.test'>new rules</a> for stablecoin issuers.</p>",
            "The SEC proposed new rules for stablecoin issuers.",
        ),
        # Named and numeric entities are decoded.
        ("&amp;stablecoins &#8220;reserve&#8221;", "&stablecoins “reserve”"),
        ("caf&eacute; &#x2014; ok", "café — ok"),
        # &nbsp; becomes a normal space.
        ("The&nbsp;SEC", "The SEC"),
        # Block tags leave a space, so words don't run together.
        ("<p>One</p><p>Two</p>", "One Two"),
        ("line<br>break<br/>again", "line break again"),
        ("<ul><li>a</li><li>b</li></ul>", "a b"),
        ("<table><tr><td>x</td><td>y</td></tr></table>", "x y"),
        # Inline tags leave nothing, so a word split by them stays whole.
        ("<b>un</b>believable", "unbelievable"),
        # Tag names are case-insensitive.
        ("<P>Upper</P>case", "Upper case"),
        # Script, style, and comments are not content.
        ("<style>p{color:red}</style><script>x()</script><p>Text</p>", "Text"),
        ("<!-- hidden -->Shown", "Shown"),
        # Newlines and runs of spaces collapse to one space.
        ("<p>Line one\n\n   line two</p>", "Line one line two"),
        # Escaped markup is text the source meant to show, so it stays.
        ("&lt;b&gt;not a tag&lt;/b&gt;", "<b>not a tag</b>"),
    ],
)
def test_clean_html(html, expected):
    assert clean_html(html) == expected


@pytest.mark.parametrize(
    "text",
    ["AT&T and S&P 500", "a<b", "rates < 5% and > 2%", "Already plain text."],
)
def test_plain_text_passes_through_unchanged(text):
    assert clean_html(text) == text


@pytest.mark.parametrize("empty", [None, "", "   ", "<p> </p>", "<br/>", "<script>x()</script>"])
def test_empty_summary_returns_none(empty):
    assert clean_html(empty) is None


def test_parse_cleans_summary():
    item = parse(_feed_with_summary("<p>Hello &amp; <b>welcome</b></p>"), "test")[0]
    assert item["summary"] == "Hello & welcome"


def test_parse_raw_keeps_original_html():
    original = "<p>Hello &amp; <b>welcome</b></p>"
    item = parse(_feed_with_summary(original), "test")[0]
    assert item["raw"]["summary"] == original


def test_parse_leaves_title_alone():
    item = parse(_feed_with_summary("x"), "test")[0]
    assert item["title"] == "SEC & CFTC"


def test_parse_missing_summary_is_none():
    feed = (
        '<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>'
        "<item><title>A</title><link>https://example.com/a</link></item></channel></rss>"
    )
    assert parse(feed, "test")[0]["summary"] is None


def test_real_sec_feed_summaries_are_clean():
    # First 3 items of https://www.sec.gov/news/pressreleases.rss, saved Oct 14, 2026.
    # The SEC double-escapes entities (&amp;nbsp;), so feedparser alone leaves "&nbsp;".
    items = parse((FIXTURES / "sec_press_releases.xml").read_text(), "sec-press-releases")
    assert len(items) == 3
    for item in items:
        assert item["summary"]
        assert "&" not in item["summary"] and "<" not in item["summary"]
        assert item["url"].startswith("https://www.sec.gov/")
    assert items[0]["summary"].startswith("The Securities and Exchange Commission\u2019s Small")
    assert "&nbsp;" in items[0]["raw"]["summary"]
