"use client";

import Link from "next/link";
import type { Moment } from "@/lib/api";

export default function MomentCard({ moment }: { moment: Moment }) {
  const totalReactions = Object.values(moment.reaction_counts || {}).reduce((a, b) => a + b, 0);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return `${Math.floor(diffD / 7)}w ago`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* Voice header */}
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/voice/${moment.voice_profile_id}`}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition"
        >
          Voice #{moment.voice_number}
          {moment.voice_tagline && (
            <span className="text-zinc-600 ml-1">· {moment.voice_tagline}</span>
          )}
        </Link>
        <span className="text-xs text-zinc-600">{formatTime(moment.published_at)}</span>
      </div>

      {/* Moment text */}
      <p className="text-zinc-200 leading-relaxed mb-3">
        &ldquo;{moment.anonymized_text}&rdquo;
      </p>

      {/* Audio + reactions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {moment.audio_url && (
            <span className="text-zinc-500 text-sm">
              ▶ {moment.audio_duration_secs ? `${Math.ceil(moment.audio_duration_secs / 60)} min` : ""}
            </span>
          )}
        </div>

        {totalReactions > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {moment.reaction_counts?.cry ? <span>😢 {moment.reaction_counts.cry}</span> : null}
            {moment.reaction_counts?.hug ? <span>🤗 {moment.reaction_counts.hug}</span> : null}
            {moment.reaction_counts?.heart ? <span>❤️ {moment.reaction_counts.heart}</span> : null}
            {moment.reaction_counts?.strong ? <span>💪 {moment.reaction_counts.strong}</span> : null}
          </div>
        )}
      </div>
    </div>
  );
}
