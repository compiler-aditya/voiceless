"use client";

import { useState, useEffect } from "react";
import { getMoments, type Moment } from "@/lib/api";
import MomentCard from "@/components/MomentCard";
import Link from "next/link";

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getMoments(page)
      .then((data) => setMoments((prev) => (page === 1 ? data.moments : [...prev, ...data.moments])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-2">
          B-Side <span className="text-secondary">Moments</span>
        </h1>
        <p className="text-on-surface-variant">
          Short, meaningful life moments shared anonymously. Follow a voice to hear their journey unfold.
        </p>
      </div>

      <div className="space-y-4">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </div>

      {loading && (
        <div className="text-center text-on-surface-variant py-8">Loading moments...</div>
      )}

      {!loading && moments.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-surface-container border border-outline-variant/10 text-on-surface-variant px-5 py-2.5 rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {!loading && moments.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          No moments shared yet.
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined">mic</span>
          Post a Moment
        </Link>
      </div>
    </div>
  );
}
