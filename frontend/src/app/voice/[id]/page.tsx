"use client";

import { useState, useEffect, use } from "react";
import { getVoiceProfile, type VoiceProfile } from "@/lib/api";
import MomentCard from "@/components/MomentCard";

export default function VoiceProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVoiceProfile(id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-zinc-500 py-16">Loading...</div>;
  if (!profile) return <div className="text-center text-zinc-500 py-16">Voice not found.</div>;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-light text-zinc-100 mb-1">
          Voice #{profile.voice_number}
        </h1>
        {profile.tagline && (
          <p className="text-zinc-500 italic">&ldquo;{profile.tagline}&rdquo;</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-zinc-500">
          <span>{profile.follower_count} followers</span>
          <span>{profile.moment_count} moments shared</span>
        </div>
      </div>

      {/* Moments */}
      <div>
        <h2 className="text-xs text-zinc-600 uppercase tracking-wide mb-3">
          Their Moments
        </h2>
        <div className="space-y-3">
          {profile.moments.map((m) => (
            <MomentCard
              key={m.id}
              moment={{
                ...m,
                voice_number: profile.voice_number,
                voice_tagline: profile.tagline,
                voice_profile_id: profile.id,
              }}
            />
          ))}
        </div>
        {profile.moments.length === 0 && (
          <p className="text-zinc-600 text-center py-8">No moments shared yet.</p>
        )}
      </div>
    </div>
  );
}
