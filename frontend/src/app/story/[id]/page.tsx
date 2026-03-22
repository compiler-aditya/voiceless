"use client";

import { useState, useEffect, use } from "react";
import { getStory, type Story } from "@/lib/api";
import AudioPlayer from "@/components/AudioPlayer";
import ReactionBar from "@/components/ReactionBar";
import TimeCapsule from "@/components/TimeCapsule";
import YoureNotAlone from "@/components/YoureNotAlone";
import ReflectionWidget from "@/components/ReflectionWidget";
import IdentityPromise from "@/components/IdentityPromise";

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
    return <div className="text-center text-zinc-500 py-16">Loading story...</div>;
  }

  if (!story) {
    return <div className="text-center text-zinc-500 py-16">Story not found.</div>;
  }

  const sourceLabel =
    story.source_type === "cc_blog"
      ? `Found on a ${story.time_capsule?.era || ""} blog`
      : "Submitted anonymously";

  return (
    <div className="space-y-6">
      {/* Story header */}
      <div className="text-center">
        <div className="text-xs text-zinc-600 uppercase tracking-wide mb-2">
          {story.category} · {sourceLabel}
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
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">
            &ldquo;{story.title}&rdquo;
          </h2>
          <p className="text-zinc-400 leading-relaxed italic">
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
        <a
          href={`/submit?category=${story.category}`}
          className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-6 py-2.5 rounded-full text-sm hover:border-zinc-700 transition"
        >
          Share YOUR story about {story.category}
        </a>
      </div>
    </div>
  );
}
