"use client";

import Link from "next/link";
import type { Story } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  loss: "text-blue-400",
  love: "text-rose-400",
  identity: "text-purple-400",
  work: "text-amber-400",
  family: "text-green-400",
  fear: "text-red-400",
  joy: "text-yellow-400",
  change: "text-teal-400",
  regret: "text-orange-400",
  hope: "text-emerald-400",
};

export default function StoryCard({ story }: { story: Story }) {
  const categoryColor = CATEGORY_COLORS[story.category] || "text-zinc-400";
  const totalReactions = Object.values(story.reaction_counts || {}).reduce((a, b) => a + b, 0);

  const sourceLabel =
    story.source_type === "cc_blog"
      ? "From the Internet's Archives"
      : "Submitted by someone like you";

  const formatDuration = (secs?: number) => {
    if (!secs) return "";
    return `${Math.floor(secs / 60)} min`;
  };

  return (
    <Link href={`/story/${story.id}`} className="block group">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition">
        {/* Source label */}
        <div className="text-xs text-zinc-600 uppercase tracking-wide mb-2">
          {sourceLabel}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-zinc-100 group-hover:text-white transition mb-2">
          &ldquo;{story.title}&rdquo;
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm">
          <span className={categoryColor}>{story.category}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">{formatDuration(story.audio_duration_secs)}</span>
          {story.listen_count > 0 && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">{story.listen_count.toLocaleString()} listeners</span>
            </>
          )}
        </div>

        {/* Reactions summary */}
        {totalReactions > 0 && (
          <div className="mt-3 text-sm text-zinc-500">
            {totalReactions.toLocaleString()} people felt this too
          </div>
        )}
      </div>
    </Link>
  );
}
