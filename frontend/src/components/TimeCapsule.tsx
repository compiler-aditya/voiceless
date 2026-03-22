"use client";

interface TimeCapsuleProps {
  era?: number;
  facts: string[];
  cultural_context: string[];
  statistics: string[];
}

export default function TimeCapsule({ era, facts, cultural_context, statistics }: TimeCapsuleProps) {
  const allContent = [...facts, ...cultural_context, ...statistics];
  if (allContent.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-xs text-zinc-600 uppercase tracking-wide mb-2">
        Time Capsule {era && `· ${era}`}
      </div>
      <div className="space-y-2">
        {facts.map((fact, i) => (
          <p key={`f-${i}`} className="text-zinc-300 text-sm leading-relaxed">{fact}</p>
        ))}
        {cultural_context.map((ctx, i) => (
          <p key={`c-${i}`} className="text-zinc-400 text-sm italic">{ctx}</p>
        ))}
        {statistics.map((stat, i) => (
          <p key={`s-${i}`} className="text-zinc-500 text-sm">{stat}</p>
        ))}
      </div>
    </div>
  );
}
