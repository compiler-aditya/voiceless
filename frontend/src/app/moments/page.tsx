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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-light text-zinc-100 mb-2">Moments</h1>
        <p className="text-zinc-500 text-sm">
          Short, meaningful life moments shared anonymously. Follow a voice to hear their journey unfold.
        </p>
      </div>

      <div className="space-y-3">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </div>

      {loading && (
        <div className="text-center text-zinc-500 py-8">Loading moments...</div>
      )}

      {!loading && moments.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-full text-sm hover:text-zinc-200 transition"
          >
            Load more
          </button>
        </div>
      )}

      {!loading && moments.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No moments shared yet.
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          href="/submit"
          className="inline-block bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition"
        >
          Post a Moment
        </Link>
      </div>
    </div>
  );
}
