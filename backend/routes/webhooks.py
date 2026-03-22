from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/firecrawl")
async def firecrawl_webhook(request: Request):
    """Handle Firecrawl job completion webhooks."""
    body = await request.json()
    event_type = body.get("type", "")

    if event_type == "agent.completed":
        # Process discovered CC blogs
        pass
    elif event_type == "batch_scrape.completed":
        # Process scraped blog posts
        pass

    return {"received": True}


@router.post("/elevenlabs")
async def elevenlabs_webhook(request: Request):
    """Handle ElevenLabs post-call webhooks."""
    body = await request.json()
    event_type = body.get("type", "")

    if event_type == "post_call_transcription":
        # Process conversation analysis from reflection agent
        conversation_id = body.get("conversation_id")
        analysis = body.get("analysis", {})
        # Could store insights about what themes resonate most
        pass

    return {"received": True}
