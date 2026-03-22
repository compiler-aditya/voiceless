"use client";

import { useState, useRef } from "react";
import { submitTextStory, submitVoiceStory, submitBlog, getSubmissionStatus } from "@/lib/api";
import IdentityPromise from "@/components/IdentityPromise";

type Tab = "write" | "speak" | "blog";

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
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setResult({ id: "", status: `Found ${res.candidates?.length || 0} potential stories` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blog scraping failed");
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async () => {
    if (!result?.id) return;
    try {
      const status = await getSubmissionStatus(result.id);
      setResult({ id: status.id, status: status.status });
    } catch {
      // ignore
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Story received</h2>
          <p className="text-on-surface-variant mb-1">Status: {result.status}</p>
          {result.id && (
            <p className="text-on-surface-variant/60 text-sm">
              Your story is being anonymized and produced into an audio episode.
            </p>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            {result.id && (
              <button
                onClick={checkStatus}
                className="bg-surface-container border border-outline-variant/10 text-on-surface-variant px-5 py-2.5 rounded-full text-sm font-medium hover:border-primary-container/30 transition-all"
              >
                Check status
              </button>
            )}
            <button
              onClick={() => { setResult(null); setText(""); setBlogUrl(""); }}
              className="bg-primary-container text-on-primary px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <input
            type="url"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            placeholder="https://yourblog.com"
            className="w-full bg-surface-container border border-outline-variant/10 rounded-xl p-4 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary-container/40 transition-colors"
          />
          <p className="text-on-surface-variant/60 text-sm">
            We&apos;ll scan your blog and find the most emotionally compelling posts.
            You choose which ones to share anonymously.
          </p>
          <button
            onClick={handleBlogSubmit}
            disabled={submitting || !blogUrl}
            className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? "Scanning..." : "Scan Blog"}
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
