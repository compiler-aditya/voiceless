"use client";

import { useState } from "react";

interface ReflectionWidgetProps {
  agentId?: string;
  storyTheme: string;
  emotion: string;
  era?: number;
}

export default function ReflectionWidget({ agentId, storyTheme, emotion, era }: ReflectionWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!agentId) return null;

  const dynamicVars = JSON.stringify({
    story_theme: storyTheme,
    emotion,
    era: era ? String(era) : "unknown",
  });

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl p-5 text-left hover:border-primary-container/30 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                mic
              </span>
            </div>
            <div>
              <div className="text-on-surface font-bold">Talk about this</div>
              <div className="text-on-surface-variant text-sm">
                Have a reflective conversation about what you just heard.
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mic
                </span>
              </div>
              <span className="text-on-surface font-bold">Reflection Companion</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <elevenlabs-convai
                  agent-id="${agentId}"
                  dynamic-variables='${dynamicVars}'
                ></elevenlabs-convai>
              `,
            }}
          />
        </div>
      )}
    </div>
  );
}
