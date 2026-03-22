"use client";

import Link from "next/link";
import type { Moment } from "@/lib/api";

const BORDER_COLORS = [
  "border-primary-container",
  "border-secondary",
  "border-tertiary",
  "border-primary",
];

export default function MomentCard({ moment }: { moment: Moment }) {
  const totalReactions = Object.values(moment.reaction_counts || {}).reduce((a, b) => a + b, 0);
  const borderColor = BORDER_COLORS[(moment.voice_number || 0) % BORDER_COLORS.length];

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
    <div className={`bg-surface-container-low p-4 rounded-xl border-l-4 ${borderColor} flex gap-4 items-center group cursor-pointer hover:bg-surface-container transition-colors`}>
      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
        <span className="material-symbols-outlined">mic_external_on</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <Link
            href={`/voice/${moment.voice_profile_id}`}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors font-bold uppercase tracking-wide"
          >
            Voice #{moment.voice_number}
          </Link>
          <span className="text-[10px] text-on-surface-variant">{formatTime(moment.published_at)}</span>
        </div>
        <p className="text-sm text-on-surface truncate">
          {moment.anonymized_text}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {moment.audio_url && (
            <span className="text-[10px] text-on-surface-variant">
              {moment.audio_duration_secs ? `${moment.audio_duration_secs}s` : ""}
            </span>
          )}
          {totalReactions > 0 && (
            <span className="text-[10px] text-on-surface-variant">
              {totalReactions} reactions
            </span>
          )}
        </div>
      </div>

      <span className="material-symbols-outlined text-on-surface-variant opacity-40 flex-shrink-0">
        play_circle
      </span>
    </div>
  );
}
