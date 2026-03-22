"""Time Capsule context engine — enrich stories with era-specific context using Firecrawl."""

import json
from firecrawl import FirecrawlApp
from google import genai
from config import settings

fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)
gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def build_time_capsule(anonymized_text: str, category: str) -> dict:
    """Build a 'time capsule' of contextual facts around a story.

    Returns:
        {
            "era": int | None,
            "facts": [str],
            "cultural_context": [str],
            "statistics": [str]
        }
    """
    # Step 1: Extract temporal signals from the story
    signals = await _extract_signals(anonymized_text)

    facts = []
    cultural = []
    statistics = []

    # Step 2: If we have a year, search for era context
    year = signals.get("year")
    if year:
        facts = await _search_era_facts(year, category)
        cultural = await _search_cultural_context(year)

    # Step 3: Search for category-specific statistics
    theme = signals.get("theme", category)
    statistics = await _search_statistics(category, theme)

    return {
        "era": year,
        "facts": facts[:3],
        "cultural_context": cultural[:3],
        "statistics": statistics[:2],
    }


async def _extract_signals(text: str) -> dict:
    """Extract temporal and thematic signals from story text."""
    response = gemini.models.generate_content(
        model=MODEL,
        contents=f"""Extract temporal and contextual signals from this anonymous story.

Respond as JSON only:
{{"year": 2012, "season": "summer", "location_type": "small town", "theme": "closing a business"}}

If no year is mentioned or inferable, set year to null.
If no season is mentioned, set season to null.

TEXT:
{text}""",
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        return {"year": None, "season": None, "location_type": None, "theme": ""}


async def _search_era_facts(year: int, category: str) -> list[str]:
    """Search for what was happening in the world during that year."""
    try:
        results = fc.search(
            query=f"what happened in {year} {category} statistics facts",
            params={"limit": 5},
        )

        if not results or not results.get("data"):
            return []

        # Extract concise facts using Gemini
        snippets = "\n".join(
            r.get("description", "") or r.get("title", "")
            for r in results["data"][:5]
            if r.get("description") or r.get("title")
        )

        response = gemini.models.generate_content(
            model=MODEL,
            contents=f"""From these search results about {year}, extract 2-3 short factual statements
that would provide meaningful context for a story about {category}.

Format: One fact per line, each under 20 words. Focus on statistics or cultural moments.
Example: "That year, 400,000 small businesses closed across the country."

SEARCH RESULTS:
{snippets}""",
        )

        return [line.strip() for line in response.text.strip().split("\n") if line.strip()]
    except Exception:
        return []


async def _search_cultural_context(year: int) -> list[str]:
    """Search for cultural context (music, movies, etc.) from that era."""
    try:
        results = fc.search(
            query=f"most popular song movie {year} pop culture",
            params={"limit": 3},
        )

        if not results or not results.get("data"):
            return []

        snippets = "\n".join(
            r.get("description", "") or r.get("title", "")
            for r in results["data"][:3]
            if r.get("description") or r.get("title")
        )

        response = gemini.models.generate_content(
            model=MODEL,
            contents=f"""From these search results about {year}, extract 1-2 cultural context facts.
Format: short, evocative phrases. Example: "'Poker Face' was on every radio that summer."

SEARCH RESULTS:
{snippets}""",
        )

        return [line.strip() for line in response.text.strip().split("\n") if line.strip()]
    except Exception:
        return []


async def _search_statistics(category: str, theme: str) -> list[str]:
    """Search for statistics about how many people experience this."""
    try:
        results = fc.search(
            query=f"how many people experience {theme} {category} statistics",
            params={"limit": 3},
        )

        if not results or not results.get("data"):
            return []

        snippets = "\n".join(
            r.get("description", "") or r.get("title", "")
            for r in results["data"][:3]
            if r.get("description") or r.get("title")
        )

        response = gemini.models.generate_content(
            model=MODEL,
            contents=f"""Extract 1-2 statistics about how common this experience is.
Format: empathetic, connecting. Example: "2.3 million families experienced the same kind of loss that year."

SEARCH RESULTS:
{snippets}""",
        )

        return [line.strip() for line in response.text.strip().split("\n") if line.strip()]
    except Exception:
        return []
