"""'You're Not Alone' matching — find similar stories using Firecrawl search."""

import json
from firecrawl import FirecrawlApp
from google import genai
from config import settings

fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)
gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def find_similar_stories(anonymized_text: str, category: str, emotion: str) -> list[dict]:
    """Find similar stories from across the internet.

    Returns list of:
        {"snippet": str, "year": int | None, "source_type": "blog"}
    """
    # Step 1: Extract a searchable theme summary
    theme = await _extract_theme(anonymized_text)

    # Step 2: Search for similar CC-licensed writing
    results_cc = await _search_similar(f"personal blog {theme} creative commons {category}")

    # Step 3: Search for similar personal essays generally
    results_general = await _search_similar(f"personal essay {theme} {emotion} experience")

    # Step 4: Combine, deduplicate, and anonymize snippets
    all_results = results_cc + results_general
    similar = await _process_results(all_results, category)

    return similar[:5]


async def _extract_theme(text: str) -> str:
    """Summarize the core universal feeling as a search query."""
    response = gemini.models.generate_content(
        model=MODEL,
        contents=f"""Summarize the core universal feeling in this story in 8-12 words,
suitable as a web search query. Focus on the FEELING, not the specifics.

Example: "closing a business you built letting go of a dream"
Example: "forgiving a parent after years of resentment"
Example: "losing someone and learning to live with the silence"

TEXT:
{text}

Return ONLY the search query, nothing else.""",
    )
    return response.text.strip()


async def _search_similar(query: str) -> list[dict]:
    """Run a Firecrawl search and return raw results."""
    try:
        results = fc.search(query=query, params={"limit": 5})
        if results and results.get("data"):
            return results["data"]
    except Exception:
        pass
    return []


async def _process_results(results: list[dict], category: str) -> list[dict]:
    """Extract key sentences from search results and anonymize them."""
    if not results:
        return []

    # Collect snippets
    snippets_text = ""
    for r in results[:8]:
        desc = r.get("description", "") or ""
        title = r.get("title", "") or ""
        snippets_text += f"- {title}: {desc}\n"

    if not snippets_text.strip():
        return []

    response = gemini.models.generate_content(
        model=MODEL,
        contents=f"""From these search results about {category}, extract the most powerful
single sentences that show someone else experienced something similar.

Rules:
- Anonymize everything (remove names, places, specific dates)
- Keep only the emotional core
- Each snippet should be 1-2 sentences max
- Make them feel like fragments of real human experience
- Try to extract an approximate year if mentioned

Respond as JSON array only:
[{{"snippet": "I thought I was the only one who...", "year": 2011}}, ...]

SEARCH RESULTS:
{snippets_text}""",
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        items = json.loads(raw)
        return [
            {
                "snippet": item.get("snippet", ""),
                "year": item.get("year"),
                "source_type": "blog",
            }
            for item in items
            if item.get("snippet")
        ]
    except (json.JSONDecodeError, IndexError):
        return []
