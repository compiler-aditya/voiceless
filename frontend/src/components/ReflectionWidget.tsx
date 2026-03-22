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
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-700 transition"
        >
          <div className="text-zinc-300 font-medium">🎙 Talk about this</div>
          <div className="text-zinc-500 text-sm mt-1">
            Have a reflective conversation about what you just heard.
          </div>
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-zinc-300 font-medium">Reflection Companion</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 text-sm"
            >
              Close
            </button>
          </div>
          {/* ElevenLabs Conversational AI Widget */}
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
