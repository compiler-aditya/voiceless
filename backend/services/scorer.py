"""Story quality scoring and moment evaluation using Gemini."""

import json
from google import genai
from config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def score_story(text: str) -> dict:
    """Score a story on emotional depth, universality, and originality.

    Returns:
        {
            "emotional_depth": int (1-10),
            "universality": int (1-10),
            "originality": int (1-10),
            "category": str,
            "emotion": str,
            "is_ai_probability": float (0-1),
            "title_suggestion": str,
            "passes": bool
        }
    """
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Score this personal story for an anonymous storytelling platform.

Rate on three dimensions (1-10):

1. EMOTIONAL_DEPTH: Does it convey genuine, specific emotion?
   Low (1-3): Generic statements like "I was sad" or "it was hard"
   Medium (4-6): Real emotion but surface-level
   High (7-10): Specific, visceral feeling — "the silence in the house was louder than any argument"

2. UNIVERSALITY: Would a stranger from a completely different culture relate?
   Low: Too niche or requires specific context to understand
   High: The details are personal but the FEELING is universal

3. ORIGINALITY: Is this a fresh perspective?
   Low: Generic advice, listicle, motivational cliche, "live laugh love" energy
   High: A unique window into a real human experience

Also determine:
- CATEGORY: exactly one of: loss, love, identity, work, family, fear, joy, change, regret, hope
- EMOTION: exactly one of: grief, joy, anger, nostalgia, fear, peace, love, regret
- IS_AI: probability this was written by AI (0.0 = definitely human, 1.0 = definitely AI)
- TITLE: suggest a short evocative title (3-6 words, no quotes)

Respond as JSON only, no markdown:
{{"emotional_depth": 8, "universality": 9, "originality": 7, "category": "loss", "emotion": "grief", "is_ai_probability": 0.1, "title_suggestion": "The Last Customer"}}

TEXT:
{text}""",
    )

    try:
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        return {
            "emotional_depth": 0,
            "universality": 0,
            "originality": 0,
            "category": "hope",
            "emotion": "peace",
            "is_ai_probability": 0.5,
            "title_suggestion": "Untitled",
            "passes": False,
        }

    result["passes"] = (
        result.get("emotional_depth", 0) >= 7
        and result.get("universality", 0) >= 7
        and result.get("originality", 0) >= 7
        and result.get("is_ai_probability", 1.0) < 0.7
    )

    return result


async def score_stories_batch(posts: list[dict]) -> list[tuple[dict, dict]]:
    """Score multiple blog posts and return sorted by quality.

    Args:
        posts: List of {"url": str, "title": str, "text": str}

    Returns:
        List of (post, score) tuples sorted by total score descending
    """
    scored = []
    for post in posts:
        score = await score_story(post["text"])
        if score["passes"]:
            scored.append((post, score))

    scored.sort(
        key=lambda x: x[1]["emotional_depth"] + x[1]["universality"] + x[1]["originality"],
        reverse=True,
    )
    return scored


async def evaluate_moment(text: str) -> dict:
    """Evaluate if a life moment is meaningful enough to publish.

    Returns:
        {
            "approved": bool,
            "score": float,
            "guidance": str | None,
            "emotion": str,
            "category": str
        }
    """
    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Evaluate if this is a meaningful life moment worth sharing on an anonymous storytelling platform.

MEANINGFUL (score 6-10):
- Real emotional inflection points ("Today I forgave someone I swore I never would")
- Moments of realization, loss, joy, courage, vulnerability
- Something that would make a stranger stop scrolling and listen

NOT MEANINGFUL (score 1-5):
- Daily routine ("went to gym", "had coffee", "worked late")
- Generic status updates ("feeling tired", "busy day")
- Mundane observations without emotional weight

If the score is below 6, write a gentle redirect message. NOT rejection — encouragement to dig deeper. Examples:
- "Thanks for sharing. Was there a specific moment today that surprised you or made you feel something unexpected?"
- "What was the one thing about today that you'll still remember next week?"

Respond as JSON only, no markdown:
{{"score": 7.5, "is_meaningful": true, "guidance": null, "emotion": "peace", "category": "change"}}

TEXT:
{text}""",
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        return {"approved": True, "score": 6.0, "guidance": None, "emotion": "peace", "category": "hope"}

    return {
        "approved": result.get("is_meaningful", False),
        "score": result.get("score", 0),
        "guidance": result.get("guidance"),
        "emotion": result.get("emotion", "peace"),
        "category": result.get("category", "hope"),
    }
