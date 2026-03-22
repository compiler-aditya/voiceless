"use client";

import { useState, useRef } from "react";
import { submitTextStory, submitVoiceStory, submitBlog, getSubmissionStatus } from "@/lib/api";
import IdentityPromise from "@/components/IdentityPromise";

type Tab = "write" | "speak" | "blog";

export default function SubmitPage() {
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice recording state
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

  // Poll for status
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
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎙</div>
          <h2 className="text-xl text-zinc-100 mb-2">Story received</h2>
          <p className="text-zinc-500 mb-1">Status: {result.status}</p>
          {result.id && (
            <p className="text-zinc-600 text-sm">
              Your story is being anonymized and produced into an audio episode.
            </p>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            {result.id && (
              <button
                onClick={checkStatus}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm hover:border-zinc-700 transition"
              >
                Check status
              </button>
            )}
            <button
              onClick={() => { setResult(null); setText(""); setBlogUrl(""); }}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm hover:border-zinc-700 transition"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-light text-zinc-100 mb-2">What&apos;s your story?</h1>
        <p className="text-zinc-500 text-sm">
          Write or speak about a moment that changed you, a memory you carry, or something you&apos;ve never told anyone.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 justify-center">
        {([
          { key: "write" as Tab, label: "Write It" },
          { key: "speak" as Tab, label: "Speak It" },
          { key: "blog" as Tab, label: "Connect Blog" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm transition
              ${tab === t.key
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
          >
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-600">{text.length} characters</span>
            <button
              onClick={handleTextSubmit}
              disabled={submitting || text.length < 50}
              className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition
              ${recording
                ? "bg-red-600 animate-pulse"
                : "bg-zinc-800 hover:bg-zinc-700"
              }`}
          >
            {recording ? "⏹" : "🎤"}
          </button>
          <p className="text-zinc-500 text-sm mt-4">
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          <p className="text-zinc-600 text-sm">
            We&apos;ll scan your blog and find the most emotionally compelling posts.
            You choose which ones to share anonymously.
          </p>
          <button
            onClick={handleBlogSubmit}
            disabled={submitting || !blogUrl}
            className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {submitting ? "Scanning..." : "Scan Blog"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <IdentityPromise compact />
    </div>
  );
}
