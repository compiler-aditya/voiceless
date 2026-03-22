from fastapi import APIRouter, HTTPException, Query
from models.database import get_db

router = APIRouter()


@router.get("")
async def list_stories(
    category: str | None = None,
    source_type: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    """List published stories with pagination and filters."""
    db = get_db()
    offset = (page - 1) * limit

    query = (
        db.table("stories")
        .select("id, title, category, emotion, source_type, source_license, audio_url, audio_duration_secs, cover_art_url, listen_count, reaction_counts, published_at")
        .eq("status", "published")
        .order("published_at", desc=True)
    )

    if category:
        query = query.eq("category", category)
    if source_type:
        query = query.eq("source_type", source_type)

    result = query.range(offset, offset + limit - 1).execute()
    return {"stories": result.data, "page": page, "limit": limit}


@router.get("/{story_id}")
async def get_story(story_id: str):
    """Get a single story with all enrichment data."""
    db = get_db()
    result = db.table("stories").select("*").eq("id", story_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Story not found")

    # Increment listen count
    db.table("stories").update(
        {"listen_count": result.data["listen_count"] + 1}
    ).eq("id", story_id).execute()

    return result.data


@router.get("/{story_id}/similar")
async def get_similar_stories(story_id: str):
    """Get 'You're Not Alone' similar stories."""
    db = get_db()
    result = db.table("stories").select("similar_stories").eq("id", story_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Story not found")

    return {"similar_stories": result.data.get("similar_stories", [])}
