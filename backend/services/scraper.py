"""Blog scraping and CC-licensed content discovery using Firecrawl."""

import re
from urllib.parse import urlparse
from firecrawl import FirecrawlApp
from config import settings

fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

# Patterns that suggest a URL is a single article, not a blog root
ARTICLE_PATTERNS = [
    r"/\d{4}/\d{2}/",        # /2024/01/ date patterns
    r"/p/",                   # Substack /p/slug
    r"/post/",               # Generic /post/slug
    r"/blog/.+",             # /blog/some-article
    r"/article/",            # /article/slug
    r"\.html$",              # ends in .html
    r"\.htm$",               # ends in .htm
    r"/@.+/.+",              # Medium /@user/slug
    r"/\d{4}/.+/.+",        # /2024/category/slug
]

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


def _is_article_url(url: str) -> bool:
    """Heuristic: does this URL look like a single article rather than a site root?"""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")

    # Root path or very short path = not an article
    if not path or path == "/" or len(path) < 5:
        return False

    # Check known article patterns
    for pattern in ARTICLE_PATTERNS:
        if re.search(pattern, path):
            return True

    # Has multiple path segments (e.g., /blog/my-article) = likely article
    segments = [s for s in path.split("/") if s]
    if len(segments) >= 2:
        return True

    return False


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

    Handles:
    - Single article URL (paulgraham.com/greatwork.html) → scrapes that one article
    - Blog root URL (paulgraham.com) → maps site, discovers articles, scrapes top ones
    - URL without protocol → auto-adds https://
    - Medium, Substack, WordPress, custom blogs
    - Deduplicates URLs, filters non-article pages
    """
    blog_url = _normalize_url(blog_url)
    is_single = _is_article_url(blog_url)

    # --- Single article mode: skip mapping, scrape directly ---
    if is_single:
        post = await _scrape_one(blog_url)
        return [post] if post else []

    # --- Blog discovery mode: map first, then scrape ---
    urls = await _discover_urls(blog_url, limit)

    # Always include the submitted URL as fallback
    if blog_url not in urls:
        urls.insert(0, blog_url)

    # Filter and deduplicate
    seen = set()
    filtered = []
    for url in urls:
        normalized = _normalize_url(url)
        if normalized not in seen and _is_useful_url(normalized):
            seen.add(normalized)
            filtered.append(normalized)

    # Scrape articles (skip root-like pages in batch mode)
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

        text = result.markdown.strip()

        # Skip very short content (nav pages, error pages, etc.)
        # Lower threshold for direct article URLs (200) vs discovered URLs (300)
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
