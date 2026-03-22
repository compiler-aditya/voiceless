"""Celery task: CC-licensed blog discovery pipeline."""

import asyncio
from tasks.celery_app import celery


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery.task(bind=True)
def discover_cc_blogs_task(self):
    """Discover and process CC-licensed blog content."""
    from services.scraper import discover_cc_blogs, scrape_blog_posts, scrape_single_post, verify_license
    from services.scorer import score_stories_batch
    from models.database import get_db

    db = get_db()

    # Step 1: Discover CC blogs via Firecrawl Agent
    blogs = _run(discover_cc_blogs())

    discovered_posts = []

    for blog in blogs:
        # Step 2: Scrape posts from each blog
        posts = _run(scrape_blog_posts(blog["url"], limit=30))

        for post in posts:
            # Step 3: Verify license on each post
            detailed = _run(scrape_single_post(post["url"]))
            if not detailed:
                continue

            license_type = verify_license(detailed.get("attributes", {}))

            # For known public domain sources, skip license check
            if "zenhabits.net" in post["url"]:
                license_type = "CC0"

            if license_type:
                post["license"] = license_type
                discovered_posts.append(post)

    # Step 4: Score and filter
    scored = _run(score_stories_batch(discovered_posts))

    # Step 5: Queue top stories for production
    from tasks.produce_episode import produce_episode_task

    queued = 0
    for post, score in scored[:30]:  # Top 30
        result = db.table("stories").insert({
            "title": score.get("title_suggestion", "Untitled"),
            "anonymized_text": "",
            "source_type": "cc_blog",
            "source_license": post.get("license"),
            "category": score["category"],
            "emotion": score["emotion"],
            "quality_score": score,
            "status": "pending",
            "episode_script": post["text"],  # Store raw text temporarily
        }).execute()

        story_id = result.data[0]["id"]
        produce_episode_task.delay(story_id, post["text"], "cc_blog")
        queued += 1

    return {"blogs_found": len(blogs), "posts_scraped": len(discovered_posts), "queued": queued}
