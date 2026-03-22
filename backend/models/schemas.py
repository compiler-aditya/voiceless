from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# --- Enums ---

class SourceType(str, Enum):
    CC_BLOG = "cc_blog"
    USER_TEXT = "user_text"
    USER_VOICE = "user_voice"
    USER_BLOG = "user_blog"


class Category(str, Enum):
    LOSS = "loss"
    LOVE = "love"
    IDENTITY = "identity"
    WORK = "work"
    FAMILY = "family"
    FEAR = "fear"
    JOY = "joy"
    CHANGE = "change"
    REGRET = "regret"
    HOPE = "hope"


class Emotion(str, Enum):
    GRIEF = "grief"
    JOY = "joy"
    ANGER = "anger"
    NOSTALGIA = "nostalgia"
    FEAR = "fear"
    PEACE = "peace"
    LOVE = "love"
    REGRET = "regret"


class ReactionType(str, Enum):
    CRY = "cry"
    HUG = "hug"
    STRONG = "strong"
    THINK = "think"
    HEART = "heart"


class StoryStatus(str, Enum):
    PENDING = "pending"
    ANONYMIZING = "anonymizing"
    ENRICHING = "enriching"
    SCRIPTING = "scripting"
    PRODUCING = "producing"
    PUBLISHED = "published"
    REJECTED = "rejected"


class MomentStatus(str, Enum):
    PENDING = "pending"
    PRODUCING = "producing"
    PUBLISHED = "published"
    REJECTED = "rejected"


# --- Request Models ---

class TextSubmission(BaseModel):
    text: str = Field(..., min_length=50, max_length=50000)


class VoiceSubmission(BaseModel):
    audio_base64: str


class BlogSubmission(BaseModel):
    blog_url: str


class MomentCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=2000)
    voice_profile_token: str


class ReactionCreate(BaseModel):
    reaction_type: ReactionType
    session_id: str


class VoiceProfileCreate(BaseModel):
    tagline: Optional[str] = Field(None, max_length=100)


class FollowRequest(BaseModel):
    follower_token: str


# --- Response Models ---

class QualityScore(BaseModel):
    emotional_depth: int
    universality: int
    originality: int


class TimeCapsule(BaseModel):
    era: Optional[int] = None
    facts: list[str] = []
    cultural_context: list[str] = []
    statistics: list[str] = []


class SimilarStory(BaseModel):
    snippet: str
    year: Optional[int] = None
    source_type: str = "blog"


class StoryResponse(BaseModel):
    id: str
    title: str
    anonymized_text: str
    source_type: SourceType
    source_license: Optional[str] = None
    category: Category
    emotion: Emotion
    audio_url: Optional[str] = None
    audio_duration_secs: Optional[int] = None
    cover_art_url: Optional[str] = None
    time_capsule: Optional[TimeCapsule] = None
    similar_stories: list[SimilarStory] = []
    listen_count: int = 0
    reaction_counts: dict = {}
    me_too_count: int = 0
    status: StoryStatus = StoryStatus.PENDING
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class StoryCardResponse(BaseModel):
    id: str
    title: str
    category: Category
    emotion: Emotion
    source_type: SourceType
    audio_url: Optional[str] = None
    audio_duration_secs: Optional[int] = None
    cover_art_url: Optional[str] = None
    listen_count: int = 0
    reaction_counts: dict = {}


class MomentResponse(BaseModel):
    id: str
    voice_number: int
    voice_tagline: Optional[str] = None
    anonymized_text: str
    category: Optional[str] = None
    emotion: Optional[str] = None
    audio_url: Optional[str] = None
    audio_duration_secs: Optional[int] = None
    reaction_counts: dict = {}
    status: MomentStatus = MomentStatus.PENDING
    published_at: Optional[datetime] = None


class VoiceProfileResponse(BaseModel):
    id: str
    voice_number: int
    tagline: Optional[str] = None
    follower_count: int = 0
    moment_count: int = 0
    moments: list[MomentResponse] = []


class SubmissionStatusResponse(BaseModel):
    id: str
    status: str
    anonymized_preview: Optional[str] = None


class MomentEvaluation(BaseModel):
    approved: bool
    guidance: Optional[str] = None
    emotion: Optional[str] = None
    category: Optional[str] = None


class FeedResponse(BaseModel):
    stories: list[StoryCardResponse] = []
    moments: list[MomentResponse] = []
    total_listeners: int = 0
