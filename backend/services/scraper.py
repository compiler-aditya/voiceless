"""Blog scraping and CC-licensed content discovery using Firecrawl."""

import re
from urllib.parse import urlparse
from firecrawl import FirecrawlApp
from config import settings

fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

# URL path segments that are NOT articles (navigation/utility pages)
SKIP_SEGMENTS = {
    "about", "contact", "privacy", "terms", "login", "signup", "register",
    "search", "tags", "categories", "archive", "author", "feed", "rss",
    "sitemap", "wp-admin", "wp-login", "cart", "checkout", "account",
    "subscribe", "unsubscribe", "cookie", "legal", "faq", "help",
}


def _normalize_url(url: str) -> str:
    """Ensure URL has a protocol and is clean."""
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    # Remove trailing slash for consistency
    return url.rstrip("/")



def _is_index_page(url: str) -> bool:
    """Detect index/listing pages that aren't actual articles."""
    parsed = urlparse(url)
    path = parsed.path.lower().rstrip("/")
    filename = path.split("/")[-1] if "/" in path else path

    index_names = {
        "index.html", "index.htm", "articles.html", "articles.htm",
        "blog.html", "posts.html", "archive.html", "archives.html",
        "essays.html", "writing.html", "all.html", "list.html",
        "index", "articles", "blog", "posts", "archive", "archives",
        "essays", "writing",
    }
    return filename in index_names or path in ("", "/")


def _is_useful_url(url: str) -> bool:
    """Filter out navigation/utility pages that aren't articles."""
    parsed = urlparse(url)
    path = parsed.path.lower().rstrip("/")
    segments = [s for s in path.split("/") if s]

    # Skip if any segment is a known non-article page
    for seg in segments:
        if seg in SKIP_SEGMENTS:
            return False

    # Skip asset/file URLs
    if re.search(r"\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip|xml)$", path):
        return False

    return True


async def scrape_blog_posts(blog_url: str, limit: int = 50) -> list[dict]:
    """Scrape posts from a blog URL or a single article URL.

    Strategy: always try map() first to discover links. If map finds
    multiple pages, scrape those. If map finds nothing, scrape the
    submitted URL directly (single article mode).

    Handles:
    - Index pages (paulgraham.com/articles.html) → map discovers all essays
    - Single article URL (paulgraham.com/greatwork.html) → map finds nothing, scrapes directly
    - Blog root URL (paulgraham.com) → maps site, discovers articles
    - URL without protocol → auto-adds https://
    - Medium, Substack, WordPress, custom blogs
    - Deduplicates URLs, filters non-article pages
    """
    blog_url = _normalize_url(blog_url)

    # Step 1: Always try mapping to discover links
    discovered = await _discover_urls(blog_url, limit)

    # Step 2: Decide mode based on what map found
    if len(discovered) > 1:
        # Map found multiple pages — discovery mode
        urls = discovered
    else:
        # Map found 0-1 pages — single article mode, scrape submitted URL
        post = await _scrape_one(blog_url)
        return [post] if post else []

    # Step 3: Filter out non-article URLs (about, contact, etc.)
    # but keep the original URL as fallback
    seen = set()
    filtered = []
    for url in urls:
        normalized = _normalize_url(url)
        if normalized not in seen and _is_useful_url(normalized):
            seen.add(normalized)
            # Skip index/listing pages in discovery mode — we want the actual articles
            if not _is_index_page(normalized):
                filtered.append(normalized)

    if not filtered:
        # All URLs were filtered out — scrape original as fallback
        post = await _scrape_one(blog_url)
        return [post] if post else []

    # Step 4: Scrape discovered articles
    posts = []
    for url in filtered[:limit]:
        post = await _scrape_one(url)
        if post:
            posts.append(post)

    return posts


async def _discover_urls(blog_url: str, limit: int) -> list[str]:
    """Use Firecrawl map to discover article URLs on a site."""
    try:
        map_result = fc.map(url=blog_url, limit=limit)
        if map_result and map_result.links:
            return list(map_result.links)
    except Exception:
        pass
    return []


async def _scrape_one(url: str) -> dict | None:
    """Scrape a single URL and return post dict if it has meaningful content."""
    try:
        result = fc.scrape(
            url=url,
            formats=["markdown"],
            only_main_content=True,
        )

        if not result or not result.markdown:
            return None

        text = _clean_markdown(result.markdown)

        if len(text) < 200:
            return None

        title = "Untitled"
        if result.metadata:
            title = getattr(result.metadata, "title", None) or "Untitled"

        return {
            "url": url,
            "title": title,
            "text": text,
        }
    except Exception:
        return None


def _clean_markdown(md: str) -> str:
    """Clean scraped markdown of common junk: table markup, image noise, nav artifacts."""
    lines = md.split("\n")
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Skip empty table rows and image-only lines
        if re.match(r"^\|[\s\-|]*\|$", stripped):
            continue
        if re.match(r"^\|.*\|\s*$", stripped) and "![" in stripped and stripped.count("|") > 2:
            continue
        # Skip lines that are only images/links with no text
        if re.match(r"^!?\[.*\]\(.*\)$", stripped) and len(re.sub(r"!?\[.*?\]\(.*?\)", "", stripped).strip()) == 0:
            continue
        # Skip horizontal rules
        if re.match(r"^[\-\*_]{3,}$", stripped):
            continue
        cleaned.append(line)

    text = "\n".join(cleaned).strip()
    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


async def scrape_single_post(url: str) -> dict | None:
    """Scrape a single blog post and extract content + license info."""
    url = _normalize_url(url)
    return await _scrape_one(url)


async def discover_cc_blogs() -> list[dict]:
    """Use Firecrawl Agent to discover CC-licensed personal blogs."""
    try:
        result = fc.agent(
            prompt="""Find personal blogs published under Creative Commons licenses
(CC-BY, CC-BY-SA, CC0, or public domain). Focus on blogs about personal
experiences, emotions, life changes, loss, love, fear, identity, growth.

Target sources:
- zenhabits.net (explicitly uncopyrighted/public domain)
- raptitude.com (CC-BY)
- WordPress blogs with CC license metadata
- Medium posts published under CC
- Personal domains with CC declarations in footer

For each blog found, return:
- The blog URL
- The detected license type
- A brief description of the content

Return at least 10 blogs.""",
            schema={
                "type": "object",
                "properties": {
                    "blogs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "url": {"type": "string"},
                                "license": {"type": "string"},
                                "description": {"type": "string"},
                            },
                        },
                    },
                },
            },
            max_credits=2500,
        )

        if result and hasattr(result, "data") and result.data:
            blogs = result.data.get("blogs", []) if isinstance(result.data, dict) else []
            return blogs
    except Exception:
        pass
    return []


def verify_license(attributes: dict) -> str | None:
    """Verify CC license from scraped page attributes."""
    valid_licenses = {
        "creativecommons.org/publicdomain/zero": "CC0",
        "creativecommons.org/licenses/by/": "CC-BY",
        "creativecommons.org/licenses/by-sa/": "CC-BY-SA",
        "creativecommons.org/licenses/by-nc/": "CC-BY-NC",
    }

    for key, values in attributes.items():
        if not isinstance(values, list):
            values = [values]
        for value in values:
            if not isinstance(value, str):
                continue
            value_lower = value.lower()
            for pattern, license_type in valid_licenses.items():
                if pattern in value_lower:
                    return license_type

    return None
