"""Voice creation using ElevenLabs Voice Design and Text-to-Voice APIs."""

import random
from elevenlabs.client import ElevenLabs
from config import settings

client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

# Voice trait pools for generating diverse anonymous voices
VOICE_TRAITS = {
    "age": ["young adult", "mid-thirties", "middle-aged", "mature"],
    "quality": ["warm", "clear", "soft", "deep", "rich", "gentle", "steady"],
    "texture": ["slight rasp", "smooth", "breathy", "resonant", "crystalline"],
    "cadence": ["thoughtful cadence", "measured pace", "natural rhythm", "calm delivery"],
}

# Emotion → voice direction mapping
EMOTION_VOICE_MAP = {
    "grief": "Quiet, measured, slightly low-pitched. Like someone speaking at 2 AM in an empty room. Stability low for natural tremor.",
    "joy": "Warm, slightly breathless, bright. Like someone sharing wonderful news they can barely contain.",
    "anger": "Steady, clear, controlled intensity. Not shouting — a seething clarity. Each word deliberate.",
    "nostalgia": "Soft, slightly distant, warm undertone. Like someone looking out a rain-streaked window remembering.",
    "fear": "Slightly faster, tighter, with urgency. Like someone who needs to get the words out before courage fades.",
    "peace": "Slow, deep, calm. Like someone who has finally arrived at understanding after a long journey.",
    "love": "Tender, careful with every syllable. Like each word is something precious and fragile.",
    "regret": "Heavy, with natural pauses. Like the words physically weigh something and take effort to lift.",
}


async def create_emotion_matched_voice(emotion: str) -> tuple[str, str]:
    """Create a voice matched to a story's primary emotion.

    Returns (voice_id, voice_description)
    """
    direction = EMOTION_VOICE_MAP.get(emotion, EMOTION_VOICE_MAP["peace"])

    voice = client.text_to_voice.create_previews(
        voice_description=direction,
        text="I remember the exact moment. Not the date, not the time. Just the feeling.",
    )

    if voice and voice.previews:
        preview = voice.previews[0]
        # Save the voice to library
        saved = client.text_to_voice.create_voice_from_preview(
            voice_name=f"voiceless-story-{emotion}",
            voice_description=direction,
            generated_voice_id=preview.generated_voice_id,
        )
        return saved.voice_id, direction

    raise RuntimeError(f"Failed to create voice for emotion: {emotion}")


async def create_random_voice() -> tuple[str, str]:
    """Create a unique random voice for an anonymous user profile.

    Returns (voice_id, voice_description)
    """
    age = random.choice(VOICE_TRAITS["age"])
    quality = random.choice(VOICE_TRAITS["quality"])
    texture = random.choice(VOICE_TRAITS["texture"])
    cadence = random.choice(VOICE_TRAITS["cadence"])

    description = f"A {quality} {age} voice with {texture} and {cadence}."

    voice = client.text_to_voice.create_previews(
        voice_description=description,
        text="Today something happened that I need to share.",
    )

    if voice and voice.previews:
        preview = voice.previews[0]
        saved = client.text_to_voice.create_voice_from_preview(
            voice_name=f"voiceless-user-{random.randint(1000, 9999)}",
            voice_description=description,
            generated_voice_id=preview.generated_voice_id,
        )
        return saved.voice_id, description

    raise RuntimeError("Failed to create random voice")


async def create_narrator_voice() -> str:
    """Create the consistent narrator voice used across all episodes.

    Returns voice_id. Should only be called once during setup.
    """
    description = "A warm, gentle, wise narrator voice. Mid-range pitch, unhurried pace. Like a trusted friend telling you something important. Clear enunciation with natural warmth."

    voice = client.text_to_voice.create_previews(
        voice_description=description,
        text="Someone wrote this on a blog in 2012. Nobody read it. Until today.",
    )

    if voice and voice.previews:
        preview = voice.previews[0]
        saved = client.text_to_voice.create_voice_from_preview(
            voice_name="voiceless-narrator",
            voice_description=description,
            generated_voice_id=preview.generated_voice_id,
        )
        return saved.voice_id

    raise RuntimeError("Failed to create narrator voice")
