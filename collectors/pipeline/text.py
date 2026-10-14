"""Text cleanup shared by every source type.

Feeds and APIs often send summaries as HTML. clean_html() turns that into
plain text for the `summary` column; collectors keep the original in `raw`.
"""

import html
import re
from html.parser import HTMLParser

# Tags that end a line or block of text. A space goes where each one was, so
# "<p>one</p><p>two</p>" becomes "one two" instead of "onetwo". Inline tags
# (<a>, <b>, <span>, ...) add nothing, so "<b>un</b>believable" stays one word.
_BLOCK_TAGS = frozenset(
    {
        "address", "article", "blockquote", "br", "dd", "div", "dl", "dt",
        "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6",
        "header", "hr", "li", "ol", "p", "pre", "section", "table", "td",
        "th", "tr", "ul",
    }
)

# Tags whose text is code, not content.
_SKIP_TAGS = frozenset({"script", "style"})

# Something shaped like a real tag: "<p>", "</a>", "<br/>", "<!-- -->".
_TAG_RE = re.compile(r"<[a-zA-Z!/][^>]*>")
_WHITESPACE_RE = re.compile(r"\s+")


class _TextExtractor(HTMLParser):
    """Collects the visible text of an HTML snippet."""

    def __init__(self) -> None:
        # convert_charrefs decodes entities in the text: &amp; -> &, &#8220; -> “
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag in _SKIP_TAGS:
            self._skip_depth += 1
        elif tag in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_startendtag(self, tag: str, attrs: list) -> None:
        # Self-closing tags like <br/>. Never opens a skip region.
        if tag in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in _SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
        elif tag in _BLOCK_TAGS:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self.parts.append(data)


def clean_html(text: str | None) -> str | None:
    """Turn an HTML snippet into one line of plain text.

    Returns None when there is no text left (None, "", or only tags/whitespace).
    """
    if text is None:
        return None
    if _TAG_RE.search(text):
        extractor = _TextExtractor()
        extractor.feed(text)
        extractor.close()
        text = "".join(extractor.parts)
    else:
        # No tags, so don't run the HTML parser: it would read "a<b" as the
        # start of a tag and drop it. Only entities need decoding.
        text = html.unescape(text)
    return _WHITESPACE_RE.sub(" ", text).strip() or None
