"""Celery task: Moment audio production."""

import asyncio
from datetime import datetime, timezone
from tasks.celery_app import celery


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery.task(bind=True, max_retries=2)
def produce_moment_task(self, moment_id: str, anonymized_text: str, voice_id: str):
    """Produce audio for a life moment."""
    from models.database import get_db
    from services.producer import produce_moment

    db = get_db()

    try:
        db.table("moments").update({"status": "producing"}).eq("id", moment_id).execute()

        # Produce audio
        audio_bytes, duration = _run(produce_moment(anonymized_text, voice_id))

        # Upload to Supabase Storage
        storage_path = f"moments/{moment_id}.mp3"
        db.storage.from_("audio").upload(
            path=storage_path,
            file=audio_bytes,
            file_options={"content-type": "audio/mpeg"},
        )
        audio_url = db.storage.from_("audio").get_public_url(storage_path)

        # Update moment count on voice profile
        moment_data = db.table("moments").select("voice_profile_id").eq("id", moment_id).single().execute()
        if moment_data.data:
            profile_id = moment_data.data["voice_profile_id"]
            profile = db.table("voice_profiles").select("moment_count").eq("id", profile_id).single().execute()
            if profile.data:
                db.table("voice_profiles").update(
                    {"moment_count": profile.data["moment_count"] + 1}
                ).eq("id", profile_id).execute()

        # Publish
        db.table("moments").update({
            "audio_url": audio_url,
            "audio_duration_secs": duration,
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", moment_id).execute()

        return {"status": "published", "moment_id": moment_id}

    except Exception as exc:
        db.table("moments").update({"status": "pending"}).eq("id", moment_id).execute()
        raise self.retry(exc=exc, countdown=30)
