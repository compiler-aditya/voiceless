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
    if (isPlaying) audio.pause();
    else audio.play();
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
    <div className="glass-player rounded-xl p-6 md:p-8 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
        {/* Album Art */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-secondary rounded-lg rotate-3" />
          <div className="relative w-full h-full bg-surface-container-highest rounded-lg shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary/40">graphic_eq</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h4 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h4>
          </div>

          {/* Waveform Visualization */}
          <div className="h-14 flex items-end gap-1 px-2">
            {[4, 8, 12, 10, 14, 6, 16, 10, 4, 8, 12, 6].map((h, i) => {
              const barProgress = (i / 12) * 100;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    barProgress < progress ? "bg-primary" : "bg-primary/30"
                  }`}
                  style={{ height: `${h * 3}px` }}
                />
              );
            })}
          </div>

          {/* VU-style Progress Bar */}
          <div className="space-y-2">
            <div
              className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer"
              onClick={seek}
            >
              <div className="h-full vu-meter-bar transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-tighter">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-6 pt-2">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              skip_previous
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              skip_next
            </button>
            <div className="flex-1" />
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              favorite
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              share
            </button>
          </div>
        </div>
      </div>

      {/* Story text excerpt */}
      {text && (
        <div className="mt-6 bg-surface-container-lowest rounded-lg p-4 max-h-40 overflow-y-auto border border-outline-variant/10">
          <p className="text-on-surface-variant text-sm leading-relaxed italic">
            &ldquo;{text.slice(0, 500)}{text.length > 500 ? "..." : ""}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
