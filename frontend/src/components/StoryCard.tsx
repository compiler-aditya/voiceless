"use client";

import Link from "next/link";
import type { Story } from "@/lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  loss: "water_drop",
  love: "favorite",
  identity: "person",
  work: "work",
  family: "group",
  fear: "bolt",
  joy: "celebration",
  change: "autorenew",
  regret: "history",
  hope: "light_mode",
};

export default function StoryCard({ story, index }: { story: Story; index?: number }) {
  const totalReactions = Object.values(story.reaction_counts || {}).reduce((a, b) => a + b, 0);
  const icon = CATEGORY_ICONS[story.category] || "graphic_eq";

  const formatDuration = (secs?: number) => {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Link href={`/story/${story.id}`} className="block group">
      <div className="flex items-center gap-4 md:gap-6 p-4 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer even:bg-surface-container-low">
        {/* Track number */}
        {index !== undefined && (
          <div className="text-on-surface-variant font-bold text-sm w-6 text-right">
            {String(index).padStart(2, "0")}
          </div>
        )}

        {/* Category icon */}
        <div className="w-12 h-12 bg-surface-container-highest rounded flex items-center justify-center relative flex-shrink-0">
          <span className="material-symbols-outlined text-primary/60">{icon}</span>
          <span
            className="material-symbols-outlined absolute text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h6 className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
            {story.title}
          </h6>
          <p className="text-xs text-on-surface-variant truncate">
            {story.category} &middot;{" "}
            {story.source_type === "cc_blog" ? "From the Archives" : "Anonymous Submission"}
          </p>
        </div>

        {/* Listen count */}
        {story.listen_count > 0 && (
          <div className="hidden md:block text-xs text-on-surface-variant font-medium w-28">
            {story.listen_count.toLocaleString()} listens
          </div>
        )}

        {/* Duration */}
        <div className="hidden md:block text-xs text-on-surface-variant font-medium w-14">
          {formatDuration(story.audio_duration_secs)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 text-on-surface-variant">
          {totalReactions > 0 && (
            <span className="text-xs hidden md:inline">{totalReactions}</span>
          )}
          <span className="material-symbols-outlined text-lg">favorite</span>
        </div>
      </div>
    </Link>
  );
}
