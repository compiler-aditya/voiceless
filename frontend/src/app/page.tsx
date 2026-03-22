"use client";

import { useState, useEffect } from "react";
import { getFeed, type Story, type Moment } from "@/lib/api";
import IdentityPromise from "@/components/IdentityPromise";
import StoryCard from "@/components/StoryCard";
import MomentCard from "@/components/MomentCard";

const CATEGORIES = [
  "all", "loss", "love", "identity", "work", "family",
  "fear", "joy", "change", "regret", "hope",
];

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFeed(category === "all" ? undefined : category)
      .then((data) => {
        setStories(data.stories || []);
        setMoments(data.moments || []);
      })
      .catch(() => {
        setStories([]);
        setMoments([]);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const ccStories = stories.filter((s) => s.source_type === "cc_blog");
  const userStories = stories.filter((s) => s.source_type !== "cc_blog");

  return (
    <div className="space-y-8">
      <div className="text-center py-4">
        <h1 className="text-3xl font-light text-zinc-100 mb-2">voiceless</h1>
        <p className="text-zinc-500">Every story matters. No name needed.</p>
      </div>

      <IdentityPromise />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm capitalize whitespace-nowrap transition
              ${category === cat
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Loading stories...</div>
      ) : (
        <>
          {ccStories.length > 0 && (
            <section>
              <h2 className="text-xs text-zinc-600 uppercase tracking-wide mb-3">
                From the Internet&apos;s Archives
              </h2>
              <div className="space-y-3">
                {ccStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {userStories.length > 0 && (
            <section>
              <h2 className="text-xs text-zinc-600 uppercase tracking-wide mb-3">
                Submitted by Someone Like You
              </h2>
              <div className="space-y-3">
                {userStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          )}

          {moments.length > 0 && (
            <section>
              <h2 className="text-xs text-zinc-600 uppercase tracking-wide mb-3">
                Moments
              </h2>
              <div className="space-y-3">
                {moments.map((moment) => (
                  <MomentCard key={moment.id} moment={moment} />
                ))}
              </div>
            </section>
          )}

          {stories.length === 0 && moments.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-4">No stories yet. Be the first to share.</p>
              <a
                href="/submit"
                className="inline-block bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition"
              >
                Share Your Story
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
