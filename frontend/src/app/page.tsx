"use client";

import { useState, useEffect } from "react";
import { getFeed, type Story, type Moment } from "@/lib/api";
import StoryCard from "@/components/StoryCard";
import MomentCard from "@/components/MomentCard";
import Link from "next/link";

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

  const featured = stories[0];
  const playlist = stories.slice(1);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-low min-h-[300px] flex items-center p-8 md:p-12 vinyl-glow">
        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight">
            Press play on <br />someone&apos;s <span className="text-primary-container">truth</span>.
          </h2>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-8 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
          >
            <span>Start Listening</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        {/* Abstract Vinyl Art */}
        <div className="absolute right-[-10%] top-[-20%] w-[400px] h-[400px] md:w-[500px] md:h-[500px] opacity-30">
          <div className="w-full h-full rounded-full border-[30px] border-surface-container-lowest shadow-[inset_0_0_100px_rgba(249,115,22,0.2)] flex items-center justify-center">
            <div className="w-2/3 h-2/3 rounded-full border border-outline-variant/30 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full bg-primary-container/20 border-8 border-surface-container-lowest" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all
              ${category === cat
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-on-surface-variant py-12">Loading stories...</div>
      ) : (
        <>
          {/* Featured Story + B-Side Moments Grid */}
          {(featured || moments.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Featured Story (Now Playing) */}
              {featured && (
                <div className="xl:col-span-2 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Featured Selection
                  </h3>
                  <Link href={`/story/${featured.id}`} className="block group">
                    <div className="glass-player rounded-xl p-6 md:p-8 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                        {/* Album Art */}
                        <div className="relative w-40 h-40 flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-secondary rounded-lg rotate-3 group-hover:rotate-6 transition-transform" />
                          <div className="relative w-full h-full bg-surface-container-highest rounded-lg shadow-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-primary/40">graphic_eq</span>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="flex-1 space-y-3 w-full text-center md:text-left">
                          <div>
                            <h4 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">
                              {featured.title}
                            </h4>
                            <p className="text-primary font-medium tracking-wide">
                              {featured.category} &middot; {featured.audio_duration_secs ? `${Math.ceil(featured.audio_duration_secs / 60)} min` : ""}
                            </p>
                          </div>
                          {/* Waveform */}
                          <div className="h-12 flex items-end gap-1 px-2">
                            {[4, 8, 12, 10, 14, 6, 16, 10, 4].map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-primary rounded-full"
                                style={{ height: `${h * 3}px`, opacity: 0.4 + i * 0.07 }}
                              />
                            ))}
                          </div>
                          {/* Play button hint */}
                          <div className="flex items-center gap-4 justify-center md:justify-start pt-2">
                            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                play_arrow
                              </span>
                            </div>
                            <span className="text-on-surface-variant text-sm">
                              {featured.listen_count > 0 ? `${featured.listen_count.toLocaleString()} listens` : "Be the first to listen"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* B-Side Moments */}
              {moments.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    B-Side Moments
                  </h3>
                  <div className="space-y-4">
                    {moments.slice(0, 4).map((m) => (
                      <MomentCard key={m.id} moment={m} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Story Feed (Playlist Style) */}
          {playlist.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-4">
                <div>
                  <h3 className="text-3xl md:text-4xl font-extrabold tracking-tighter">Daily Playlist</h3>
                  <p className="text-on-surface-variant font-medium">Curated stories from the archives</p>
                </div>
              </div>
              <div className="space-y-1">
                {playlist.map((story, i) => (
                  <StoryCard key={story.id} story={story} index={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stories.length === 0 && moments.length === 0 && (
            <div className="text-center py-16">
              <p className="text-on-surface-variant mb-4">No stories yet. Be the first to share.</p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
              >
                Share Your Story
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
