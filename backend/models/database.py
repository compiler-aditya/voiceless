"""Supabase database client and table operations."""

from supabase import create_client, Client
from config import settings

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client


# --- SQL to run in Supabase SQL Editor ---
SCHEMA_SQL = """
-- Voice profiles (must be created before moments due to FK)
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_number SERIAL,
  tagline TEXT,
  elevenlabs_voice_id TEXT NOT NULL,
  voice_description TEXT,
  follower_count INT DEFAULT 0,
  moment_count INT DEFAULT 0,
  auth_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stories (full episodes)
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  anonymized_text TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('cc_blog', 'user_text', 'user_voice', 'user_blog')),
  source_license TEXT,
  source_year INT,
  category TEXT NOT NULL,
  emotion TEXT NOT NULL,
  quality_score JSONB,
  audio_url TEXT,
  audio_duration_secs INT,
  voice_id TEXT,
  narrator_voice_id TEXT,
  cover_art_url TEXT,
  time_capsule JSONB,
  similar_stories JSONB,
  episode_script TEXT,
  listen_count INT DEFAULT 0,
  reaction_counts JSONB DEFAULT '{}',
  me_too_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'anonymizing', 'enriching', 'scripting', 'producing', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Moments (short life moments)
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES voice_profiles(id),
  original_text TEXT NOT NULL,
  anonymized_text TEXT NOT NULL,
  category TEXT,
  emotion TEXT,
  quality_score FLOAT,
  audio_url TEXT,
  audio_duration_secs INT,
  reaction_counts JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'producing', 'published', 'rejected')),
  rejection_guidance TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  follower_profile_id UUID REFERENCES voice_profiles(id),
  following_profile_id UUID REFERENCES voice_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_profile_id, following_profile_id)
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id),
  moment_id UUID REFERENCES moments(id),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('cry', 'hug', 'strong', 'think', 'heart')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (story_id IS NOT NULL OR moment_id IS NOT NULL)
);

-- Write backs (anonymous voice responses)
CREATE TABLE IF NOT EXISTS write_backs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id),
  audio_url TEXT NOT NULL,
  anonymized_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_voice ON moments(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_moments_published ON moments(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_story ON reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_reactions_moment ON reactions(moment_id);
"""
