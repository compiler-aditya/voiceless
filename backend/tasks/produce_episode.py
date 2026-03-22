"""Celery task: Full episode production pipeline.

Flow: score → anonymize → enrich → script → produce → upload → publish
"""

import asyncio
from datetime import datetime, timezone
from tasks.celery_app import celery


def _run(coro):
    """Run an async function from sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery.task(bind=True, max_retries=2)
def produce_episode_task(self, story_id: str, raw_text: str, source_type: str):
    """Full production pipeline for a story."""
    from models.database import get_db
    from services.scorer import score_story
    from services.anonymizer import anonymize_text
    from services.timecapsule import build_time_capsule
    from services.matcher import find_similar_stories
    from services.scriptwriter import generate_episode_script
    from services.producer import produce_episode
    from services.agent_setup import create_reflection_agent
    from config import settings

    db = get_db()

    try:
        # Step 1: Score the story
        db.table("stories").update({"status": "anonymizing"}).eq("id", story_id).execute()
        score = _run(score_story(raw_text))

        if not score["passes"]:
            db.table("stories").update({
                "status": "rejected",
                "quality_score": score,
            }).eq("id", story_id).execute()
            return {"status": "rejected", "reason": "quality_score_too_low"}

        # Step 2: Anonymize
        anonymized = _run(anonymize_text(raw_text))

        db.table("stories").update({
            "anonymized_text": anonymized,
            "category": score["category"],
            "emotion": score["emotion"],
            "quality_score": score,
            "title": score.get("title_suggestion", "Untitled"),
            "status": "enriching",
        }).eq("id", story_id).execute()

        # Step 3: Enrich with time capsule + similar stories
        time_capsule = _run(build_time_capsule(anonymized, score["category"]))
        similar = _run(find_similar_stories(anonymized, score["category"], score["emotion"]))

        db.table("stories").update({
            "time_capsule": time_capsule,
            "similar_stories": [s for s in similar],
            "status": "scripting",
        }).eq("id", story_id).execute()

        # Step 4: Generate episode script
        title = score.get("title_suggestion", "Untitled")
        script = _run(generate_episode_script(
            anonymized, time_capsule, similar,
            score["category"], score["emotion"], title,
        ))

        db.table("stories").update({
            "episode_script": str(script),
            "status": "producing",
        }).eq("id", story_id).execute()

        # Step 5: Produce audio
        narrator_voice_id = settings.NARRATOR_VOICE_ID
        audio_bytes, duration = _run(produce_episode(script, narrator_voice_id))

        # Step 6: Upload to Supabase Storage
        storage_path = f"episodes/{story_id}.mp3"
        db.storage.from_("audio").upload(
            path=storage_path,
            file=audio_bytes,
            file_options={"content-type": "audio/mpeg"},
        )
        audio_url = db.storage.from_("audio").get_public_url(storage_path)

        # Step 7: Create reflection agent
        agent_id = _run(create_reflection_agent(
            story_id=story_id,
            title=title,
            category=score["category"],
            emotion=score["emotion"],
            anonymized_text=anonymized,
            time_capsule=time_capsule,
            similar_count=len(similar),
        ))

        # Step 8: Publish
        db.table("stories").update({
            "audio_url": audio_url,
            "audio_duration_secs": duration,
            "narrator_voice_id": narrator_voice_id,
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", story_id).execute()

        return {"status": "published", "story_id": story_id, "agent_id": agent_id}

    except Exception as exc:
        db.table("stories").update({"status": "pending"}).eq("id", story_id).execute()
        raise self.retry(exc=exc, countdown=60)
