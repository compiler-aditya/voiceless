"use client";

import { useState, useEffect, use } from "react";
import { getStory, type Story } from "@/lib/api";
import AudioPlayer from "@/components/AudioPlayer";
import ReactionBar from "@/components/ReactionBar";
import TimeCapsule from "@/components/TimeCapsule";
import YoureNotAlone from "@/components/YoureNotAlone";
import ReflectionWidget from "@/components/ReflectionWidget";
import IdentityPromise from "@/components/IdentityPromise";
import Link from "next/link";

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStory(id)
      .then(setStory)
      .catch(() => setStory(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center text-on-surface-variant py-16">Loading story...</div>;
  }

  if (!story) {
    return <div className="text-center text-on-surface-variant py-16">Story not found.</div>;
  }

  const sourceLabel =
    story.source_type === "cc_blog"
      ? `From the Archives ${story.time_capsule?.era ? `\u00B7 ${story.time_capsule.era}` : ""}`
      : "Anonymous Submission";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Category badge */}
      <div className="flex items-center gap-4">
        <Link href="/" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
          arrow_back
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary-container/10 text-primary text-xs font-bold uppercase tracking-wide rounded-full">
            {story.category}
          </span>
          <span className="text-xs text-on-surface-variant">{sourceLabel}</span>
        </div>
      </div>

      {/* Audio player */}
      {story.audio_url ? (
        <AudioPlayer
          audioUrl={story.audio_url}
          title={story.title}
          duration={story.audio_duration_secs}
          text={story.anonymized_text}
        />
      ) : (
        <div className="glass-player rounded-xl p-6 md:p-8 border border-outline-variant/10 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            {story.title}
          </h2>
          <p className="text-on-surface-variant leading-relaxed italic">
            {story.anonymized_text}
          </p>
        </div>
      )}

      {/* Identity promise */}
      <IdentityPromise compact />

      {/* Time Capsule */}
      {story.time_capsule && (
        <TimeCapsule
          era={story.time_capsule.era}
          facts={story.time_capsule.facts}
          cultural_context={story.time_capsule.cultural_context}
          statistics={story.time_capsule.statistics}
        />
      )}

      {/* Reactions */}
      <ReactionBar
        targetId={story.id}
        targetType="story"
        initialCounts={story.reaction_counts}
        meTooCount={story.me_too_count}
      />

      {/* You're Not Alone */}
      {story.similar_stories && story.similar_stories.length > 0 && (
        <YoureNotAlone stories={story.similar_stories} />
      )}

      {/* Reflection companion */}
      <ReflectionWidget
        storyTheme={story.category}
        emotion={story.emotion}
        era={story.time_capsule?.era}
      />

      {/* Share prompt */}
      <div className="text-center py-4">
        <Link
          href={`/submit?category=${story.category}`}
          className="inline-flex items-center gap-2 bg-surface-container border border-outline-variant/10 text-on-surface-variant px-6 py-3 rounded-full text-sm font-medium hover:border-primary-container/30 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Share YOUR story about {story.category}
        </Link>
      </div>
    </div>
  );
}
