from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import stories, moments, voices, reactions, submit, webhooks

app = FastAPI(
    title="Voiceless API",
    description="Anonymous storytelling platform — every story matters, no name needed.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stories.router, prefix="/api/stories", tags=["stories"])
app.include_router(moments.router, prefix="/api/moments", tags=["moments"])
app.include_router(voices.router, prefix="/api/voices", tags=["voices"])
app.include_router(reactions.router, prefix="/api/reactions", tags=["reactions"])
app.include_router(submit.router, prefix="/api/submit", tags=["submit"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "voiceless"}


@app.get("/api/feed")
async def get_feed(category: str | None = None, page: int = 1, limit: int = 20):
    """Home feed: published stories + recent moments."""
    from models.database import get_db

    db = get_db()
    offset = (page - 1) * limit

    # Fetch published stories
    query = db.table("stories").select("*").eq("status", "published").order("published_at", desc=True)
    if category:
        query = query.eq("category", category)
    stories_result = query.range(offset, offset + limit - 1).execute()

    # Fetch recent moments
    moments_result = (
        db.table("moments")
        .select("*, voice_profiles(voice_number, tagline)")
        .eq("status", "published")
        .order("published_at", desc=True)
        .range(0, 9)
        .execute()
    )

    return {
        "stories": stories_result.data,
        "moments": moments_result.data,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
