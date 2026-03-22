"""4-pass anonymization pipeline using Gemini."""

from google import genai
from config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def anonymize_text(text: str, light: bool = False) -> str:
    """Run multi-pass anonymization on text.

    Args:
        text: Raw story text
        light: If True, run lighter anonymization (for moments)
    """
    if light:
        return await _light_anonymize(text)

    # Pass 1: Entity removal
    pass1 = await _pass_entity_removal(text)

    # Pass 2: Digital fingerprint removal
    pass2 = await _pass_fingerprint_removal(pass1)

    # Pass 3: Emotional preservation check
    pass3 = await _pass_emotional_check(text, pass2)

    # Pass 4: Traceability verification
    pass4 = await _pass_traceability_check(pass3)

    return pass4


async def _pass_entity_removal(text: str) -> str:
    """Pass 1: Remove all identifying entities."""
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""You are an expert anonymizer. Remove ALL identifying information from this text while preserving the emotional core.

RULES:
- Names → generic terms ("my friend", "my partner", "my boss", "my mother")
- Specific cities/towns → "a small town" / "a big city" / "a coastal town" / "a quiet neighborhood"
- Company names → "the company" / "the startup" / "the factory" / "the office"
- School names → "my school" / "the university"
- Specific dates → keep vague ("one summer" / "when I was in my twenties" / "a few years ago")
- Specific numbers that could identify (number of kids, salary amounts) → generalize ("several children", "barely enough to get by")
- Email addresses, phone numbers, social media handles → remove entirely
- Street addresses → remove entirely
- Unique identifiers (employee IDs, license plates) → remove entirely

CRITICAL: The emotional content, narrative arc, and core feeling MUST remain intact. You are removing identity, not meaning.

Return ONLY the anonymized text, nothing else.

TEXT:
{text}""",
    )
    return response.text.strip()


async def _pass_fingerprint_removal(text: str) -> str:
    """Pass 2: Remove digital fingerprints that could be googled back to source."""
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Review this already-anonymized text for digital fingerprints that could trace it back to its original author.

REMOVE OR REPHRASE:
- Unique phrases or idioms that are highly specific and googleable
- Unusual writing style markers (very distinctive sentence structures, made-up words, catchphrases)
- Hyper-specific cultural references that narrow down identity or location too much
- Exact quotes from conversations that someone involved might recognize
- Unique event descriptions that only one person could have experienced

PRESERVE:
- The emotional tone and narrative arc
- Universal feelings and relatable moments
- The general situation and its impact
- Poetic or beautiful phrasing (unless it's a known quote from the author)

Return ONLY the cleaned text, nothing else.

TEXT:
{text}""",
    )
    return response.text.strip()


async def _pass_emotional_check(original: str, anonymized: str) -> str:
    """Pass 3: Verify the core emotion survived anonymization."""
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Compare the original and anonymized versions of this story.

Rate the emotional preservation on a scale of 1-10:
- 10 = The anonymized version hits just as hard emotionally
- 7-9 = Minor emotional loss but core feeling intact
- 4-6 = Significant emotional loss, needs revision
- 1-3 = The anonymization killed the story

If the score is below 8, rewrite the anonymized version to restore the lost emotional power while keeping all identifying information removed.

ORIGINAL:
{original}

ANONYMIZED:
{anonymized}

Respond in this exact format:
SCORE: [number]
TEXT: [the final anonymized text — either the original anonymized if score >= 8, or your improved version]""",
    )

    result = response.text.strip()
    lines = result.split("\n", 1)

    # Extract text after "TEXT:" marker
    for i, line in enumerate(lines):
        if line.startswith("TEXT:"):
            return line[5:].strip() + "\n".join(lines[i + 1:]) if i + 1 < len(lines) else line[5:].strip()

    # Fallback: if format wasn't followed, return the anonymized text
    if "TEXT:" in result:
        return result.split("TEXT:", 1)[1].strip()
    return anonymized


async def _pass_traceability_check(text: str) -> str:
    """Pass 4: Search for the anonymized text to verify it can't be traced."""
    try:
        from firecrawl import FirecrawlApp
        fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

        # Search first 150 chars of the anonymized text
        search_query = text[:150].replace('"', "").replace("\n", " ")
        results = fc.search(query=f'"{search_query}"', limit=3)

        if results and results.get("data"):
            # Found matches — needs further anonymization
            response = client.models.generate_content(
                model=MODEL,
                contents=f"""This anonymized text was found to match existing content online.
Rephrase it further to make it untraceable while keeping the emotional core.
Change sentence structures, swap synonyms, restructure paragraphs.

TEXT:
{text}

Return ONLY the rephrased text.""",
            )
            return response.text.strip()
    except Exception:
        # If Firecrawl search fails, proceed with current text
        pass

    return text


async def _light_anonymize(text: str) -> str:
    """Lighter anonymization for short moments."""
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Anonymize this short text by removing any names, specific places, company names, or other identifying details.
Keep it brief and preserve the raw emotion.
Return ONLY the anonymized text.

TEXT:
{text}""",
    )
    return response.text.strip()
