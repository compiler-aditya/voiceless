from fastapi import APIRouter, HTTPException, Query
from models.schemas import MomentCreate
from models.database import get_db
import hashlib

router = APIRouter()


@router.get("")
async def list_moments(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50)):
    """List published moments in reverse chronological order."""
    db = get_db()
    offset = (page - 1) * limit

    result = (
        db.table("moments")
        .select("*, voice_profiles(voice_number, tagline)")
        .eq("status", "published")
        .order("published_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    moments = []
    for m in result.data:
        profile = m.pop("voice_profiles", {}) or {}
        moments.append({
            **m,
            "voice_number": profile.get("voice_number", 0),
            "voice_tagline": profile.get("tagline"),
        })

    return {"moments": moments, "page": page, "limit": limit}


@router.get("/following")
async def list_following_moments(token: str, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=50)):
    """List moments from voices the user follows."""
    db = get_db()
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    # Find the user's voice profile
    profile = (
        db.table("voice_profiles")
        .select("id")
        .eq("auth_token_hash", token_hash)
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    # Get who they follow
    follows = (
        db.table("follows")
        .select("following_profile_id")
        .eq("follower_profile_id", profile.data["id"])
        .execute()
    )
    following_ids = [f["following_profile_id"] for f in follows.data]

    if not following_ids:
        return {"moments": [], "page": page, "limit": limit}

    offset = (page - 1) * limit
    result = (
        db.table("moments")
        .select("*, voice_profiles(voice_number, tagline)")
        .in_("voice_profile_id", following_ids)
        .eq("status", "published")
        .order("published_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    moments = []
    for m in result.data:
        profile_data = m.pop("voice_profiles", {}) or {}
        moments.append({
            **m,
            "voice_number": profile_data.get("voice_number", 0),
            "voice_tagline": profile_data.get("tagline"),
        })

    return {"moments": moments, "page": page, "limit": limit}


@router.post("")
async def create_moment(moment: MomentCreate):
    """Post a new life moment."""
    db = get_db()
    token_hash = hashlib.sha256(moment.voice_profile_token.encode()).hexdigest()

    # Verify voice profile
    profile = (
        db.table("voice_profiles")
        .select("id, elevenlabs_voice_id")
        .eq("auth_token_hash", token_hash)
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    # Quality gate
    from services.scorer import evaluate_moment
    evaluation = await evaluate_moment(moment.text)

    if not evaluation["approved"]:
        return {
            "approved": False,
            "guidance": evaluation["guidance"],
        }

    # Anonymize
    from services.anonymizer import anonymize_text
    anon_text = await anonymize_text(moment.text, light=True)

    # Insert moment
    result = db.table("moments").insert({
        "voice_profile_id": profile.data["id"],
        "original_text": moment.text,
        "anonymized_text": anon_text,
        "category": evaluation.get("category"),
        "emotion": evaluation.get("emotion"),
        "quality_score": evaluation.get("score", 0),
        "status": "pending",
    }).execute()

    moment_id = result.data[0]["id"]

    # Trigger audio production
    from tasks.produce_moment import produce_moment_task
    produce_moment_task.delay(moment_id, anon_text, profile.data["elevenlabs_voice_id"])

    return {"id": moment_id, "approved": True, "status": "pending"}
