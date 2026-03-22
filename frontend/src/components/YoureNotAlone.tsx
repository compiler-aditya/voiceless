"use client";

import type { SimilarStory } from "@/lib/api";

export default function YoureNotAlone({ stories }: { stories: SimilarStory[] }) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary text-lg">group</span>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-tertiary">
            You&apos;re Not Alone
          </h3>
          <p className="text-on-surface-variant text-xs">
            {stories.length} others wrote about this same feeling
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {stories.map((s, i) => (
          <div key={i} className="border-l-2 border-tertiary/40 pl-3">
            <p className="text-on-surface-variant text-sm italic">&ldquo;{s.snippet}&rdquo;</p>
            {s.year && (
              <p className="text-on-surface-variant/50 text-xs mt-1">{s.year}, a blog</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-on-surface-variant/40 text-xs mt-4">All anonymized. All real. All human.</p>
    </div>
  );
}
