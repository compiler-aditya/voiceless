import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # API Keys
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_STORAGE_BUCKET: str = "audio"

    # Redis (for Celery)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ElevenLabs
    NARRATOR_VOICE_ID: str = os.getenv("NARRATOR_VOICE_ID", "")
    TTS_MODEL: str = "eleven_v3"
    TTS_FLASH_MODEL: str = "eleven_flash_v2_5"

    # Firecrawl
    FIRECRAWL_BASE_URL: str = "https://api.firecrawl.dev/v2"

    # App
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))


settings = Settings()
