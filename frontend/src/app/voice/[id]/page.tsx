"use client";

import { useState, useEffect, use } from "react";
import { getVoiceProfile, type VoiceProfile } from "@/lib/api";
import MomentCard from "@/components/MomentCard";
import Link from "next/link";

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

  if (loading) return <div className="text-center text-on-surface-variant py-16">Loading...</div>;
  if (!profile) return <div className="text-center text-on-surface-variant py-16">Voice not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link href="/moments" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
        arrow_back
      </Link>

      {/* Profile header */}
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-secondary mx-auto mb-4 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            mic
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">
          Voice #{profile.voice_number}
        </h1>
        {profile.tagline && (
          <p className="text-on-surface-variant italic">&ldquo;{profile.tagline}&rdquo;</p>
        )}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{profile.follower_count}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-wide">followers</div>
          </div>
          <div className="w-px h-8 bg-outline-variant/20" />
          <div className="text-center">
            <div className="text-lg font-bold text-secondary">{profile.moment_count}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-wide">moments</div>
          </div>
        </div>
      </div>

      {/* Moments */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          Their Moments
        </h2>
        <div className="space-y-4">
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
          <p className="text-on-surface-variant text-center py-8">No moments shared yet.</p>
        )}
      </div>
    </div>
  );
}
