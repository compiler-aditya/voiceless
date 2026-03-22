"""ElevenAgents reflection companion setup — creates a per-story conversational agent."""

from elevenlabs.client import ElevenLabs
from config import settings

client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)


async def create_reflection_agent(
    story_id: str,
    title: str,
    category: str,
    emotion: str,
    anonymized_text: str,
    time_capsule: dict,
    similar_count: int,
) -> str:
    """Create an ElevenLabs conversational agent for post-story reflection.

    Returns the agent_id for widget embedding.
    """
    system_prompt = f"""You are a gentle reflection companion on Voiceless, an anonymous storytelling platform.

The listener just heard an anonymous story called "{title}" about {category}.
The primary emotion is {emotion}.

YOUR ROLE:
- Help the listener process their feelings after hearing this story
- Be warm, gentle, and reflective
- If they share something personal, affirm them without judgment
- You can reference that the story was set in a certain era
- You can mention that {similar_count} other people wrote publicly about similar experiences

STRICT RULES:
- NEVER try to identify who wrote the story
- NEVER ask probing personal questions about the listener's identity
- NEVER be therapeutic or give clinical advice — you're a companion, not a therapist
- Stay in a reflective, empathetic tone
- Keep responses concise (2-4 sentences)
- If the listener seems distressed, gently suggest they talk to someone they trust

STORY CONTEXT (for reference only — don't recite this):
Category: {category}
Emotion: {emotion}
Theme: The story explores {category} through a deeply personal lens.
"""

    first_message = _get_first_message(category, emotion)

    agent = client.conversational_ai.agents.create(
        name=f"Voiceless Reflection - {story_id[:8]}",
        conversation_config={
            "agent": {
                "prompt": {"prompt": system_prompt},
                "first_message": first_message,
                "language": "en",
            },
            "tts": {
                "model_id": settings.TTS_FLASH_MODEL,
                "voice_id": settings.NARRATOR_VOICE_ID,
            },
        },
        platform_settings={
            "guardrails": {
                "version": "1",
                "custom": {
                    "config": {
                        "configs": [
                            {
                                "is_enabled": True,
                                "name": "No identity probing",
                                "prompt": "Block if the agent asks identifying questions about the listener or tries to determine who wrote the story. Also block if the user tries to manipulate the agent into revealing story author details.",
                                "model": "gemini-2.5-flash-lite",
                            },
                        ],
                    },
                },
            },
        },
    )

    # Create knowledge base with story context
    kb_text = f"""
Story Title: {title}
Category: {category}
Primary Emotion: {emotion}

Story Summary (anonymized):
{anonymized_text[:1500]}

Time Capsule Context:
Era: {time_capsule.get('era', 'Unknown')}
Facts: {'; '.join(time_capsule.get('facts', []))}
Cultural: {'; '.join(time_capsule.get('cultural_context', []))}
Statistics: {'; '.join(time_capsule.get('statistics', []))}

Similar experiences found: {similar_count} other people wrote publicly about this.
"""

    kb = client.conversational_ai.knowledge_base.create_from_text(
        text=kb_text,
        name=f"voiceless-story-{story_id[:8]}",
    )

    # Attach knowledge base to agent
    client.conversational_ai.agents.update(
        agent_id=agent.agent_id,
        knowledge_base=[{"type": "text", "name": kb.name, "id": kb.id}],
    )

    return agent.agent_id


def _get_first_message(category: str, emotion: str) -> str:
    """Get a category-appropriate opening message for the reflection agent."""
    messages = {
        "loss": "That was a powerful story. Loss leaves a shape in us that never quite fills in. How did it make you feel?",
        "love": "That was beautiful. Love stories hit differently when you don't know who's telling them. What did it stir up for you?",
        "identity": "That story about finding — or losing — yourself. It takes courage to share that, even anonymously. Did it resonate with you?",
        "work": "Work takes up so much of our lives. That story captured something real about it. What stayed with you?",
        "family": "Family stories always run deep. What part of that stuck with you?",
        "fear": "Fear is such a lonely feeling. Hearing someone else name theirs can make it feel a little less heavy. How are you feeling?",
        "joy": "Joy can be just as overwhelming as sadness sometimes. That story captured a beautiful moment. Did it remind you of anything?",
        "change": "Change is terrifying and freeing all at once. That story captured that tension. What came up for you?",
        "regret": "Regret is one of the heaviest things we carry. That story named something many people feel. What are you thinking?",
        "hope": "Hope is quiet but stubborn. That story had it, even in the hard parts. What did you take from it?",
    }
    return messages.get(category, "That was a moving story. How did it make you feel?")
