"use client";

import { useState } from "react";
import { reactToStory, reactToMoment } from "@/lib/api";

const REACTIONS = [
  { type: "cry", icon: "water_drop", label: "Moved" },
  { type: "hug", icon: "volunteer_activism", label: "Comforted" },
  { type: "strong", icon: "fitness_center", label: "Inspired" },
  { type: "think", icon: "psychology", label: "Reflective" },
  { type: "heart", icon: "favorite", label: "Love" },
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
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
      <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">How did this make you feel?</div>
      <div className="flex gap-2 flex-wrap">
        {REACTIONS.map((r) => (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            disabled={reacted.has(r.type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium
              ${reacted.has(r.type)
                ? "border-primary-container bg-primary-container/10 text-primary"
                : "border-outline-variant/20 text-on-surface-variant hover:border-primary-container hover:text-primary"
              }`}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={reacted.has(r.type) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {r.icon}
            </span>
            <span>{counts[r.type] || 0}</span>
          </button>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-3 text-sm text-on-surface-variant">
          {(meTooCount || total).toLocaleString()} people felt this too.
        </div>
      )}
    </div>
  );
}
