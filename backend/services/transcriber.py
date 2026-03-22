"""Voice submission transcription using ElevenLabs Scribe."""

import io
from elevenlabs.client import ElevenLabs
from config import settings

client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio bytes using ElevenLabs Scribe v2.

    Returns the transcribed text.
    """
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "recording.webm"

    result = client.speech_to_text.convert(
        file=audio_file,
        model_id="scribe_v2",
        tag_audio_events=False,
        no_verbatim=True,  # Remove filler words
    )

    return result.text if result.text else ""
