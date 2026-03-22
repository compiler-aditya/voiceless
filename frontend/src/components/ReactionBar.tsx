"use client";

import { useState } from "react";
import { reactToStory, reactToMoment } from "@/lib/api";

const REACTIONS = [
  { type: "cry", emoji: "😢", label: "Moved" },
  { type: "hug", emoji: "🤗", label: "Comforted" },
  { type: "strong", emoji: "💪", label: "Inspired" },
  { type: "think", emoji: "🤔", label: "Reflective" },
  { type: "heart", emoji: "❤️", label: "Love" },
];

interface ReactionBarProps {
  targetId: string;
  targetType: "story" | "moment";
  initialCounts: Record<string, number>;
  meTooCount?: number;
}

export default function ReactionBar({ targetId, targetType, initialCounts, meTooCount }: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts || {});
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  const getSessionId = () => {
    let id = typeof window !== "undefined" ? localStorage.getItem("voiceless_session") : null;
    if (!id) {
      id = crypto.randomUUID();
      if (typeof window !== "undefined") localStorage.setItem("voiceless_session", id);
    }
    return id;
  };

  const handleReact = async (reactionType: string) => {
    if (reacted.has(reactionType)) return;

    const sessionId = getSessionId();
    try {
      const fn = targetType === "story" ? reactToStory : reactToMoment;
      const result = await fn(targetId, reactionType, sessionId);
      if (result.reaction_counts) {
        setCounts(result.reaction_counts);
      }
      setReacted((prev) => new Set(prev).add(reactionType));
    } catch {
      // Silently fail
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="text-sm text-zinc-500 mb-2">How did this make you feel?</div>
      <div className="flex gap-2 flex-wrap">
        {REACTIONS.map((r) => (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            disabled={reacted.has(r.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition text-sm
              ${reacted.has(r.type)
                ? "border-zinc-600 bg-zinc-800 text-zinc-300"
                : "border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <span>{r.emoji}</span>
            <span>{counts[r.type] || 0}</span>
          </button>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-3 text-sm text-zinc-500">
          {(meTooCount || total).toLocaleString()} people felt this too.
        </div>
      )}
    </div>
  );
}
