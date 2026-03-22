"""Blog scraping and CC-licensed content discovery using Firecrawl."""

from firecrawl import FirecrawlApp
from config import settings

fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)


async def scrape_blog_posts(blog_url: str, limit: int = 50) -> list[dict]:
    """Scrape all posts from a blog URL.

    Returns list of {"url": str, "title": str, "text": str}
    """
    # Step 1: Map the blog to discover all post URLs
    map_result = fc.map(url=blog_url, limit=limit)

    if not map_result or not map_result.links:
        return []

    urls = map_result.links

    # Step 2: Scrape the posts
    posts = []
    for url in urls[:limit]:
        try:
            result = fc.scrape(
                url=url,
                formats=["markdown"],
                only_main_content=True,
            )
            if result and result.markdown:
                text = result.markdown
                # Skip very short posts (likely index/nav pages)
                if len(text) > 300:
                    title = "Untitled"
                    if result.metadata and hasattr(result.metadata, "title"):
                        title = result.metadata.title or "Untitled"
                    posts.append({
                        "url": url,
                        "title": title,
                        "text": text,
                    })
        except Exception:
            continue

    return posts


async def scrape_single_post(url: str) -> dict | None:
    """Scrape a single blog post and extract content + license info."""
    try:
        result = fc.scrape(
            url=url,
            formats=["markdown"],
            only_main_content=True,
        )

        if not result or not result.markdown:
            return None

        title = "Untitled"
        metadata = {}
        if result.metadata:
            title = getattr(result.metadata, "title", "Untitled") or "Untitled"
            metadata = result.metadata.__dict__ if hasattr(result.metadata, "__dict__") else {}

        return {
            "url": url,
            "title": title,
            "text": result.markdown,
            "attributes": {},
            "metadata": metadata,
        }
    except Exception:
        return None


async def discover_cc_blogs() -> list[dict]:
    """Use Firecrawl Agent to discover CC-licensed personal blogs."""
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
