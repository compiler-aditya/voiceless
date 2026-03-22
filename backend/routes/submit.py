from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.schemas import TextSubmission, BlogSubmission
from models.database import get_db

router = APIRouter()


@router.post("/text")
async def submit_text_story(submission: TextSubmission):
    """Submit a text story for production."""
    db = get_db()

    result = db.table("stories").insert({
        "title": "Untitled",
        "anonymized_text": "",
        "source_type": "user_text",
        "category": "hope",
        "emotion": "peace",
        "status": "pending",
        "episode_script": submission.text,
    }).execute()

    story_id = result.data[0]["id"]

    from tasks.produce_episode import produce_episode_task
    produce_episode_task.delay(story_id, submission.text, "user_text")

    return {"id": story_id, "status": "pending", "message": "Your story is being processed. Check back soon."}


@router.post("/voice")
async def submit_voice_story(audio: UploadFile = File(...)):
    """Submit a voice recording for transcription and production."""
    audio_bytes = await audio.read()

    if len(audio_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 50MB)")

    from services.transcriber import transcribe_audio
    transcript = await transcribe_audio(audio_bytes)

    if not transcript or len(transcript) < 50:
        raise HTTPException(status_code=400, detail="Could not transcribe enough content from your recording.")

    db = get_db()
    result = db.table("stories").insert({
        "title": "Untitled",
        "anonymized_text": "",
        "source_type": "user_voice",
        "category": "hope",
        "emotion": "peace",
        "status": "pending",
        "episode_script": transcript,
    }).execute()

    story_id = result.data[0]["id"]

    from tasks.produce_episode import produce_episode_task
    produce_episode_task.delay(story_id, transcript, "user_voice")

    return {"id": story_id, "status": "pending", "transcript_preview": transcript[:200]}


@router.post("/blog")
async def submit_blog(submission: BlogSubmission):
    """Submit a blog URL — we'll scrape and find the best stories.

    Handles:
    - Single article URL → scrapes that one article, scores it, returns it regardless
    - Blog root URL → maps site, scrapes articles, returns top scored candidates
    - Empty results → clear error message
    """
    from services.scraper import scrape_blog_posts

    posts = await scrape_blog_posts(submission.blog_url)

    if not posts:
        raise HTTPException(
            status_code=400,
            detail="Could not find any readable content at this URL. Check the URL and try again.",
        )

    # Score all posts
    from services.scorer import score_story
    candidates = []

    for post in posts:
        try:
            score = await score_story(post["text"][:5000])  # Cap text length for scoring
            total = score.get("emotional_depth", 0) + score.get("universality", 0) + score.get("originality", 0)
            candidates.append({
                "url": post["url"],
                "title": post.get("title", "Untitled"),
                "snippet": post["text"][:300],
                "score": score,
                "total_score": total,
                "passes_quality": score.get("passes", False),
            })
        except Exception:
            # If scoring fails, still include with zero score
            candidates.append({
                "url": post["url"],
                "title": post.get("title", "Untitled"),
                "snippet": post["text"][:300],
                "score": {},
                "total_score": 0,
                "passes_quality": False,
            })

    # Sort by total score descending
    candidates.sort(key=lambda c: c["total_score"], reverse=True)

    return {
        "blog_url": submission.blog_url,
        "total_posts_found": len(posts),
        "candidates": candidates[:10],
    }


@router.get("/status/{story_id}")
async def get_submission_status(story_id: str):
    """Check the production status of a submitted story."""
    db = get_db()
    result = (
        db.table("stories")
        .select("id, status, anonymized_text, title")
        .eq("id", story_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Submission not found")

    return {
        "id": result.data["id"],
        "status": result.data["status"],
        "title": result.data.get("title"),
        "anonymized_preview": result.data.get("anonymized_text", "")[:300] if result.data.get("anonymized_text") else None,
    }
