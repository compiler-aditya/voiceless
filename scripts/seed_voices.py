"""Create the narrator voice used across all episodes.

Run once before preloading content.
Usage: cd backend && python ../scripts/seed_voices.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.voice_designer import create_narrator_voice


async def main():
    print("Creating narrator voice...")
    voice_id = await create_narrator_voice()
    print(f"\nNarrator voice created!")
    print(f"Voice ID: {voice_id}")
    print(f"\nAdd this to your .env file:")
    print(f"NARRATOR_VOICE_ID={voice_id}")


if __name__ == "__main__":
    asyncio.run(main())
