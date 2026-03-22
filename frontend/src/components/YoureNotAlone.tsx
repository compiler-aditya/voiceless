"use client";

import type { SimilarStory } from "@/lib/api";

export default function YoureNotAlone({ stories }: { stories: SimilarStory[] }) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-sm font-medium text-zinc-200 mb-3">
        You&apos;re Not Alone
      </div>
      <p className="text-zinc-500 text-sm mb-4">
        {stories.length} other people wrote publicly about this same feeling — on blogs across the internet.
      </p>
      <div className="space-y-3">
        {stories.map((s, i) => (
          <div key={i} className="border-l-2 border-zinc-700 pl-3">
            <p className="text-zinc-400 text-sm italic">&ldquo;{s.snippet}&rdquo;</p>
            {s.year && (
              <p className="text-zinc-600 text-xs mt-1">{s.year}, a blog</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-zinc-600 text-xs mt-4">All anonymized. All real. All human.</p>
    </div>
  );
}
