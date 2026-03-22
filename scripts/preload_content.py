"""Pre-load CC-licensed content from zenhabits.net (public domain).

Run this before launch to have 20-30 episodes ready on day 1.
Usage: cd backend && python ../scripts/preload_content.py
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from config import settings
from services.scraper import scrape_blog_posts
from services.scorer import score_story
from services.anonymizer import anonymize_text
from services.timecapsule import build_time_capsule
from services.matcher import find_similar_stories
from services.scriptwriter import generate_episode_script
from services.producer import produce_episode
from services.agent_setup import create_reflection_agent
from models.database import get_db

from datetime import datetime, timezone


async def preload():
    print("=" * 60)
    print("VOICELESS — Pre-loading CC-licensed content")
    print("=" * 60)

    db = get_db()

    # Step 1: Scrape zenhabits.net (public domain — no license check needed)
    print("\n[1/7] Scraping zenhabits.net...")
    posts = await scrape_blog_posts("https://zenhabits.net", limit=100)
    print(f"  Found {len(posts)} posts")

    if not posts:
        print("ERROR: No posts found. Check FIRECRAWL_API_KEY.")
        return

    # Step 2: Score each post
    print("\n[2/7] Scoring posts for emotional quality...")
    scored = []
    for i, post in enumerate(posts):
        score = await score_story(post["text"])
        if score["passes"]:
            scored.append((post, score))
            print(f"  [{i+1}/{len(posts)}] PASS — {score.get('title_suggestion', 'Untitled')} "
                  f"(depth={score['emotional_depth']}, univ={score['universality']}, orig={score['originality']})")
        else:
            print(f"  [{i+1}/{len(posts)}] SKIP — score too low or AI-detected")

        if len(scored) >= 30:
            break

    # Sort by total score
    scored.sort(key=lambda x: x[1]["emotional_depth"] + x[1]["universality"] + x[1]["originality"], reverse=True)
    top = scored[:25]
    print(f"\n  Selected top {len(top)} stories for production")

    # Step 3-7: Process each story
    produced = 0
    for i, (post, score) in enumerate(top):
        title = score.get("title_suggestion", "Untitled")
        print(f"\n[Story {i+1}/{len(top)}] {title}")

        try:
            # Anonymize
            print("  Anonymizing...")
            anon_text = await anonymize_text(post["text"])

            # Enrich
            print("  Building time capsule...")
            time_capsule = await build_time_capsule(anon_text, score["category"])

            print("  Finding similar stories...")
            similar = await find_similar_stories(anon_text, score["category"], score["emotion"])

            # Script
            print("  Generating episode script...")
            script = await generate_episode_script(
                anon_text, time_capsule, similar,
                score["category"], score["emotion"], title,
            )

            # Produce audio
            print("  Producing audio...")
            audio_bytes, duration = await produce_episode(script, settings.NARRATOR_VOICE_ID)

            # Upload
            print("  Uploading...")
            story_result = db.table("stories").insert({
                "title": title,
                "anonymized_text": anon_text,
                "source_type": "cc_blog",
                "source_license": "CC0",
                "category": score["category"],
                "emotion": score["emotion"],
                "quality_score": score,
                "time_capsule": time_capsule,
                "similar_stories": similar,
                "episode_script": str(script),
                "audio_duration_secs": duration,
                "narrator_voice_id": settings.NARRATOR_VOICE_ID,
                "status": "published",
                "published_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

            story_id = story_result.data[0]["id"]

            # Upload audio
            storage_path = f"episodes/{story_id}.mp3"
            db.storage.from_("audio").upload(
                path=storage_path,
                file=audio_bytes,
                file_options={"content-type": "audio/mpeg"},
            )
            audio_url = db.storage.from_("audio").get_public_url(storage_path)

            db.table("stories").update({"audio_url": audio_url}).eq("id", story_id).execute()

            # Create reflection agent
            print("  Creating reflection agent...")
            await create_reflection_agent(
                story_id=story_id,
                title=title,
                category=score["category"],
                emotion=score["emotion"],
                anonymized_text=anon_text,
                time_capsule=time_capsule,
                similar_count=len(similar),
            )

            produced += 1
            print(f"  PUBLISHED — {title} ({duration}s)")

        except Exception as e:
            print(f"  ERROR — {e}")
            continue

    print(f"\n{'=' * 60}")
    print(f"Done! Produced {produced}/{len(top)} episodes.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(preload())
