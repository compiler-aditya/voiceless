const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API error");
  }
  return res.json();
}

// --- Stories ---

export async function getFeed(category?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (category) params.set("category", category);
  return fetcher<{ stories: Story[]; moments: Moment[] }>(`/feed?${params}`);
}

export async function getStories(category?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (category) params.set("category", category);
  return fetcher<{ stories: Story[]; page: number }>(`/stories?${params}`);
}

export async function getStory(id: string) {
  return fetcher<Story>(`/stories/${id}`);
}

export async function getSimilarStories(id: string) {
  return fetcher<{ similar_stories: SimilarStory[] }>(`/stories/${id}/similar`);
}

// --- Submissions ---

export async function submitTextStory(text: string) {
  return fetcher<{ id: string; status: string }>("/submit/text", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function submitVoiceStory(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${API_BASE}/submit/voice`, { method: "POST", body: formData });
  return res.json();
}

export async function submitBlog(blogUrl: string) {
  return fetcher<{ blog_url: string; candidates: BlogCandidate[] }>("/submit/blog", {
    method: "POST",
    body: JSON.stringify({ blog_url: blogUrl }),
  });
}

export async function getSubmissionStatus(id: string) {
  return fetcher<{ id: string; status: string; anonymized_preview?: string }>(`/submit/status/${id}`);
}

// --- Moments ---

export async function getMoments(page = 1) {
  return fetcher<{ moments: Moment[] }>(`/moments?page=${page}`);
}

export async function postMoment(text: string, token: string) {
  return fetcher<{ id?: string; approved: boolean; guidance?: string }>("/moments", {
    method: "POST",
    body: JSON.stringify({ text, voice_profile_token: token }),
  });
}

// --- Voices ---

export async function createVoiceProfile(tagline?: string) {
  return fetcher<{ id: string; voice_number: number; token: string }>("/voices/create", {
    method: "POST",
    body: JSON.stringify({ tagline }),
  });
}

export async function getVoiceProfile(id: string) {
  return fetcher<VoiceProfile>(`/voices/${id}`);
}

export async function followVoice(voiceId: string, token: string) {
  return fetcher<{ followed: boolean }>(`/voices/${voiceId}/follow`, {
    method: "POST",
    body: JSON.stringify({ follower_token: token }),
  });
}

// --- Reactions ---

export async function reactToStory(storyId: string, reactionType: string, sessionId: string) {
  return fetcher<{ reaction_counts: Record<string, number> }>(`/reactions/story/${storyId}`, {
    method: "POST",
    body: JSON.stringify({ reaction_type: reactionType, session_id: sessionId }),
  });
}

export async function reactToMoment(momentId: string, reactionType: string, sessionId: string) {
  return fetcher<{ reaction_counts: Record<string, number> }>(`/reactions/moment/${momentId}`, {
    method: "POST",
    body: JSON.stringify({ reaction_type: reactionType, session_id: sessionId }),
  });
}

// --- Types ---

export interface Story {
  id: string;
  title: string;
  anonymized_text: string;
  source_type: string;
  source_license?: string;
  category: string;
  emotion: string;
  audio_url?: string;
  audio_duration_secs?: number;
  cover_art_url?: string;
  time_capsule?: { era?: number; facts: string[]; cultural_context: string[]; statistics: string[] };
  similar_stories?: SimilarStory[];
  listen_count: number;
  reaction_counts: Record<string, number>;
  me_too_count: number;
  status: string;
  published_at?: string;
}

export interface SimilarStory {
  snippet: string;
  year?: number;
  source_type: string;
}

export interface Moment {
  id: string;
  voice_number: number;
  voice_tagline?: string;
  voice_profile_id?: string;
  anonymized_text: string;
  category?: string;
  emotion?: string;
  audio_url?: string;
  audio_duration_secs?: number;
  reaction_counts: Record<string, number>;
  published_at?: string;
}

export interface VoiceProfile {
  id: string;
  voice_number: number;
  tagline?: string;
  follower_count: number;
  moment_count: number;
  moments: Moment[];
}

export interface BlogCandidate {
  url: string;
  title: string;
  snippet: string;
  score: Record<string, number>;
}
