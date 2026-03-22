"use client";

import { useState, useRef } from "react";
import {
  submitTextStory,
  submitVoiceStory,
  submitBlog,
  produceBlogCandidate,
  getSubmissionStatus,
  type BlogCandidate,
} from "@/lib/api";
import IdentityPromise from "@/components/IdentityPromise";

type Tab = "write" | "speak" | "blog";
type Phase = "input" | "candidates" | "producing" | "done";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "write", label: "Write It", icon: "edit" },
  { key: "speak", label: "Speak It", icon: "mic" },
  { key: "blog", label: "Connect Blog", icon: "link" },
];

export default function SubmitPage() {
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blog candidate flow
  const [phase, setPhase] = useState<Phase>("input");
  const [candidates, setCandidates] = useState<BlogCandidate[]>([]);
  const [totalFound, setTotalFound] = useState(0);

  // Production result
  const [result, setResult] = useState<{ id: string; status: string; title?: string } | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleTextSubmit = async () => {
    if (text.length < 50) {
      setError("Your story should be at least 50 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitTextStory(text);
      setResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setSubmitting(true);
        try {
          const res = await submitVoiceStory(blob);
          setResult(res);
          setPhase("done");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Voice submission failed");
        } finally {
          setSubmitting(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleBlogSubmit = async () => {
    if (!blogUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitBlog(blogUrl);
      setCandidates(res.candidates || []);
      setTotalFound(res.total_posts_found || 0);
      setPhase("candidates");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blog scraping failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProduceCandidate = async (candidate: BlogCandidate) => {
    setSubmitting(true);
    setError(null);
    setPhase("producing");
    try {
      const res = await produceBlogCandidate({
        url: candidate.url,
        title: candidate.title,
        text: candidate.full_text || candidate.snippet,
      });
      setResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Production failed");
      setPhase("candidates");
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async () => {
    if (!result?.id) return;
    try {
      const status = await getSubmissionStatus(result.id);
      setResult({ ...result, status: status.status });
    } catch {
      // ignore
    }
  };

  const resetAll = () => {
    setPhase("input");
    setResult(null);
    setCandidates([]);
    setText("");
    setBlogUrl("");
    setError(null);
  };

  // --- Done screen ---
  if (phase === "done" && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Story received</h2>
          {result.title && result.title !== "Untitled" && (
            <p className="text-primary font-medium mb-2">&ldquo;{result.title}&rdquo;</p>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container rounded-full mb-2">
            <span className={`w-2 h-2 rounded-full ${
              result.status === "published" ? "bg-green-400" :
              result.status === "rejected" ? "bg-error" :
              "bg-secondary animate-pulse"
            }`} />
            <span className="text-sm text-on-surface-variant capitalize">{result.status}</span>
          </div>
          <p className="text-on-surface-variant/60 text-sm mt-2">
            Your story is being anonymized, scored, and produced into an audio episode.
            This may take a few minutes.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            {result.id && (
              <button
                onClick={checkStatus}
                className="bg-surface-container border border-outline-variant/10 text-on-surface-variant px-5 py-2.5 rounded-full text-sm font-medium hover:border-primary-container/30 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Check status
              </button>
            )}
            <button
              onClick={resetAll}
              className="bg-primary-container text-on-primary px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Producing screen ---
  if (phase === "producing") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="material-symbols-outlined text-3xl text-secondary">graphic_eq</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Producing your story...</h2>
        <p className="text-on-surface-variant text-sm">
          Anonymizing, scoring, and queuing for audio production.
        </p>
      </div>
    );
  }

  // --- Blog candidates selection screen ---
  if (phase === "candidates" && candidates.length > 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={resetAll} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            arrow_back
          </button>
          <div>
            <h2 className="text-2xl font-bold">
              Found {totalFound} post{totalFound !== 1 ? "s" : ""}
            </h2>
            <p className="text-on-surface-variant text-sm">
              Pick which stories to anonymize and produce as audio episodes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {candidates.map((c, i) => {
            const depth = Number(c.score?.emotional_depth) || 0;
            const univ = Number(c.score?.universality) || 0;
            const orig = Number(c.score?.originality) || 0;
            const total = depth + univ + orig;
            const category = c.score?.category || "unknown";
            const emotion = c.score?.emotion || "unknown";
            const titleSuggestion = c.score?.title_suggestion;

            return (
              <div
                key={i}
                className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5 hover:border-primary-container/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-on-surface truncate">
                      {c.title}
                    </h3>
                    {titleSuggestion && titleSuggestion !== c.title && (
                      <p className="text-primary text-sm">
                        Suggested: &ldquo;{String(titleSuggestion)}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant/60 truncate mt-0.5">{c.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.passes_quality
                        ? "bg-green-900/30 text-green-400"
                        : "bg-secondary/20 text-secondary"
                    }`}>
                      {total}/30
                    </span>
                  </div>
                </div>

                {/* Snippet */}
                <p className="text-on-surface-variant text-sm leading-relaxed mb-3 line-clamp-3">
                  {c.snippet}
                </p>

                {/* Score breakdown + metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-primary-container/10 text-primary text-xs font-bold rounded-full capitalize">
                    {String(category)}
                  </span>
                  <span className="px-2 py-0.5 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full capitalize">
                    {String(emotion)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/50">
                    Depth {depth} · Universal {univ} · Original {orig}
                  </span>
                </div>

                {/* Produce button */}
                <button
                  onClick={() => handleProduceCandidate(c)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary-container text-on-primary py-3 rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Produce This Story
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="text-error text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // --- Input screen ---
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-2">
          What&apos;s your <span className="text-primary-container">story</span>?
        </h1>
        <p className="text-on-surface-variant">
          Write or speak about a moment that changed you, a memory you carry, or something you&apos;ve never told anyone.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 justify-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all
              ${tab === t.key
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Write tab */}
      {tab === "write" && (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="I remember the day..."
            rows={10}
            className="w-full bg-surface-container border border-outline-variant/10 rounded-xl p-5 text-on-surface placeholder-on-surface-variant/40 resize-none focus:outline-none focus:border-primary-container/40 transition-colors"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant/60">{text.length} characters</span>
            <button
              onClick={handleTextSubmit}
              disabled={submitting || text.length < 50}
              className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? "Submitting..." : "Submit Story"}
            </button>
          </div>
        </div>
      )}

      {/* Speak tab */}
      {tab === "speak" && (
        <div className="text-center py-8">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={submitting}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg
              ${recording
                ? "bg-error animate-pulse shadow-error/30"
                : "bg-primary-container text-on-primary hover:scale-110"
              }`}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {recording ? "stop" : "mic"}
            </span>
          </button>
          <p className="text-on-surface-variant text-sm mt-4">
            {recording
              ? "Recording... tap to stop"
              : submitting
                ? "Processing your recording..."
                : "Tap to start recording your story"
            }
          </p>
        </div>
      )}

      {/* Blog tab */}
      {tab === "blog" && (
        <div className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
              link
            </span>
            <input
              type="url"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              placeholder="https://yourblog.com or a specific article URL"
              className="w-full bg-surface-container border border-outline-variant/10 rounded-xl p-4 pl-12 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary-container/40 transition-colors"
            />
          </div>
          <p className="text-on-surface-variant/60 text-sm">
            Paste a blog URL to discover stories, or a specific article URL to produce just that one.
            We&apos;ll scrape, score, and let you pick which ones to anonymize and publish.
          </p>
          <button
            onClick={handleBlogSubmit}
            disabled={submitting || !blogUrl}
            className="flex items-center gap-2 bg-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Scanning...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">search</span>
                Scan &amp; Score
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          <span className="text-error text-sm">{error}</span>
        </div>
      )}

      <IdentityPromise compact />
    </div>
  );
}
