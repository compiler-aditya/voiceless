"""Episode script generation using Gemini — turns story + context into a production-ready script."""

import json
from google import genai
from config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


async def generate_episode_script(
    anonymized_text: str,
    time_capsule: dict,
    similar_stories: list[dict],
    category: str,
    emotion: str,
    title: str,
) -> dict:
    """Generate a full episode script with audio directions.

    Returns:
        {
            "sections": [{"speaker": "narrator"|"story", "text": str}],
            "sound_effects": [{"description": str, "duration": float, "timing": str}],
            "music": {"description": str, "mood": str},
            "voice_direction": str
        }
    """
    # Build context strings
    tc_facts = "\n".join(f"- {f}" for f in time_capsule.get("facts", []))
    tc_cultural = "\n".join(f"- {f}" for f in time_capsule.get("cultural_context", []))
    tc_stats = "\n".join(f"- {f}" for f in time_capsule.get("statistics", []))
    similar_count = len(similar_stories)

    era = time_capsule.get("era")
    era_line = f"This story is set around {era}." if era else "No specific era mentioned."

    response = client.models.generate_content(
        model=MODEL,
        contents=f"""Write a produced audio episode script for Voiceless — an anonymous storytelling platform.

TITLE: "{title}"
CATEGORY: {category}
EMOTION: {emotion}
{era_line}

THE ANONYMIZED STORY:
{anonymized_text}

TIME CAPSULE CONTEXT (from Firecrawl web research):
Facts: {tc_facts if tc_facts else "None available"}
Cultural context: {tc_cultural if tc_cultural else "None available"}
Statistics: {tc_stats if tc_stats else "None available"}

SIMILAR STORIES FOUND: {similar_count} people wrote publicly about a similar experience.

---

SCRIPT STRUCTURE:

1. OPENING (speaker: "narrator"): 2-3 sentences. Set the emotional scene using time capsule context.
   Weave in Firecrawl facts naturally. Example: "It was 2012. The economy was still recovering.
   Across the country, 400,000 small businesses had closed that year. This is one of them."

2. STORY (speaker: "story"): The anonymized text adapted for audio.
   - Add ElevenLabs audio tags in square brackets: [gentle], [heavy], [hopeful], [trembling], [whispered]
   - Add ellipses for trailing thoughts...
   - Add [pause] markers between heavy moments
   - Adapt written text to spoken cadence (shorter sentences, natural breath points)
   - Mark intimate confessions with [whispered]

3. CONTEXT BREAK (speaker: "narrator"): 1-2 sentences. Insert time capsule details or statistics
   between story sections. Connect personal to universal.

4. YOU'RE NOT ALONE (speaker: "narrator"): 1-2 sentences.
   "{similar_count} other people wrote publicly about this same feeling. All anonymous. All real."

5. CLOSING (speaker: "narrator"): 1-2 sentences. Gentle reflection prompt.
   "If this story reminded you of your own, you're not alone."

VOICE DIRECTION: Describe the ideal voice for the "story" speaker based on the emotion.
Reference the emotion table:
- Grief: Quiet, measured, slightly low. Like someone speaking at 2 AM.
- Joy: Warm, slightly breathless. Like someone sharing good news they can't contain.
- Anger: Steady, clear, controlled heat. Not shouting — seething.
- Nostalgia: Soft, slightly distant. Like someone looking out a window.
- Fear: Slightly faster, tighter. Like someone who needs to get the words out.
- Peace: Slow, deep, calm. Like someone who finally understands.
- Love: Tender, careful with every word.
- Regret: Heavy, with pauses. Like the words physically weigh something.

SOUND EFFECTS: 1-3 ambient sounds that match the story's mood and era.
Each: description (for ElevenLabs SFX API), duration (seconds), timing (when to play).

MUSIC: One background track description and mood.

Respond as JSON only:
{{
  "sections": [
    {{"speaker": "narrator", "text": "It was 2012..."}},
    {{"speaker": "story", "text": "[heavy] I remember the last customer..."}},
    {{"speaker": "narrator", "text": "That year, 400,000 small businesses..."}}
  ],
  "sound_effects": [
    {{"description": "shop bell ringing gently then silence", "duration": 3.0, "timing": "after story section 1"}}
  ],
  "music": {{"description": "solo piano gentle melancholy reflective", "mood": "grief"}},
  "voice_direction": "Quiet measured voice slightly low like someone speaking at 2 AM"
}}""",
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        # Fallback: simple two-section script
        return {
            "sections": [
                {"speaker": "narrator", "text": f"This is a story about {category}. Listen carefully."},
                {"speaker": "story", "text": anonymized_text},
                {"speaker": "narrator", "text": "If this story reminded you of your own, you're not alone."},
            ],
            "sound_effects": [],
            "music": {"description": "gentle ambient piano", "mood": emotion},
            "voice_direction": "Warm measured voice with emotional depth",
        }
