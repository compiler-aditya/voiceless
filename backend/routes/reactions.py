from fastapi import APIRouter, HTTPException
from models.schemas import ReactionCreate
from models.database import get_db

router = APIRouter()


@router.post("/story/{story_id}")
async def react_to_story(story_id: str, reaction: ReactionCreate):
    """Add an emotion reaction to a story."""
    db = get_db()

    # Check story exists
    story = db.table("stories").select("id, reaction_counts, me_too_count").eq("id", story_id).single().execute()
    if not story.data:
        raise HTTPException(status_code=404, detail="Story not found")

    # Check for duplicate reaction from same session
    existing = (
        db.table("reactions")
        .select("id")
        .eq("story_id", story_id)
        .eq("session_id", reaction.session_id)
        .eq("reaction_type", reaction.reaction_type)
        .execute()
    )
    if existing.data:
        return {"already_reacted": True}

    # Insert reaction
    db.table("reactions").insert({
        "story_id": story_id,
        "reaction_type": reaction.reaction_type,
        "session_id": reaction.session_id,
    }).execute()

    # Update counts
    counts = story.data.get("reaction_counts", {}) or {}
    counts[reaction.reaction_type] = counts.get(reaction.reaction_type, 0) + 1

    db.table("stories").update({
        "reaction_counts": counts,
        "me_too_count": story.data["me_too_count"] + 1,
    }).eq("id", story_id).execute()

    return {"reaction_counts": counts}


@router.post("/moment/{moment_id}")
async def react_to_moment(moment_id: str, reaction: ReactionCreate):
    """Add an emotion reaction to a moment."""
    db = get_db()

    moment = db.table("moments").select("id, reaction_counts").eq("id", moment_id).single().execute()
    if not moment.data:
        raise HTTPException(status_code=404, detail="Moment not found")

    existing = (
        db.table("reactions")
        .select("id")
        .eq("moment_id", moment_id)
        .eq("session_id", reaction.session_id)
        .eq("reaction_type", reaction.reaction_type)
        .execute()
    )
    if existing.data:
        return {"already_reacted": True}

    db.table("reactions").insert({
        "moment_id": moment_id,
        "reaction_type": reaction.reaction_type,
        "session_id": reaction.session_id,
    }).execute()

    counts = moment.data.get("reaction_counts", {}) or {}
    counts[reaction.reaction_type] = counts.get(reaction.reaction_type, 0) + 1

    db.table("moments").update({"reaction_counts": counts}).eq("id", moment_id).execute()

    return {"reaction_counts": counts}
