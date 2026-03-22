"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  duration?: number;
  text?: string;
}

export default function AudioPlayer({ audioUrl, title, duration, text }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setTotalDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    audio.currentTime = fraction * totalDuration;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <h2 className="text-xl font-semibold text-zinc-100 mb-4">&ldquo;{title}&rdquo;</h2>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" rx="1" />
              <rect x="12" y="4" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 4.2a.8.8 0 011.2-.7l9 5.8a.8.8 0 010 1.4l-9 5.8a.8.8 0 01-1.2-.7V4.2z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div
            className="h-2 bg-zinc-700 rounded-full cursor-pointer"
            onClick={seek}
          >
            <div
              className="h-2 bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Scrolling text display */}
      {text && (
        <div className="bg-zinc-950 rounded-lg p-4 max-h-40 overflow-y-auto border border-zinc-800">
          <p className="text-zinc-400 text-sm leading-relaxed italic">
            &ldquo;{text.slice(0, 500)}{text.length > 500 ? "..." : ""}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
