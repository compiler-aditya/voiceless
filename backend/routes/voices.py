from fastapi import APIRouter, HTTPException
from models.schemas import VoiceProfileCreate, FollowRequest
from models.database import get_db
import hashlib
import secrets

router = APIRouter()


@router.post("/create")
async def create_voice_profile(profile: VoiceProfileCreate):
    """Create an anonymous voice profile with a unique persistent voice."""
    from services.voice_designer import create_random_voice

    voice_id, voice_desc = await create_random_voice()

    # Generate anonymous auth token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    db = get_db()
    result = db.table("voice_profiles").insert({
        "tagline": profile.tagline,
        "elevenlabs_voice_id": voice_id,
        "voice_description": voice_desc,
        "auth_token_hash": token_hash,
    }).execute()

    return {
        "id": result.data[0]["id"],
        "voice_number": result.data[0]["voice_number"],
        "token": token,  # Only returned once — user must save it
    }


@router.get("/{voice_id}")
async def get_voice_profile(voice_id: str):
    """Get a voice profile and their moments."""
    db = get_db()

    profile = (
        db.table("voice_profiles")
        .select("id, voice_number, tagline, follower_count, moment_count, created_at")
        .eq("id", voice_id)
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Voice not found")

    moments = (
        db.table("moments")
        .select("id, anonymized_text, category, emotion, audio_url, audio_duration_secs, reaction_counts, published_at")
        .eq("voice_profile_id", voice_id)
        .eq("status", "published")
        .order("published_at", desc=True)
        .limit(20)
        .execute()
    )

    return {
        **profile.data,
        "moments": moments.data,
    }


@router.post("/{voice_id}/follow")
async def follow_voice(voice_id: str, request: FollowRequest):
    """Follow a voice profile."""
    db = get_db()
    token_hash = hashlib.sha256(request.follower_token.encode()).hexdigest()

    # Find follower's profile
    follower = (
        db.table("voice_profiles")
        .select("id")
        .eq("auth_token_hash", token_hash)
        .single()
        .execute()
    )
    if not follower.data:
        raise HTTPException(status_code=404, detail="Your voice profile not found")

    if follower.data["id"] == voice_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check target exists
    target = db.table("voice_profiles").select("id, follower_count").eq("id", voice_id).single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Voice not found")

    # Create follow
    db.table("follows").upsert({
        "follower_profile_id": follower.data["id"],
        "following_profile_id": voice_id,
    }).execute()

    # Update follower count
    db.table("voice_profiles").update(
        {"follower_count": target.data["follower_count"] + 1}
    ).eq("id", voice_id).execute()

    return {"followed": True}
