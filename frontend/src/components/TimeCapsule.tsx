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
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-lg">history</span>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">
            Time Capsule {era && `\u00B7 ${era}`}
          </h3>
        </div>
      </div>
      <div className="space-y-3">
        {facts.map((fact, i) => (
          <p key={`f-${i}`} className="text-on-surface text-sm leading-relaxed">{fact}</p>
        ))}
        {cultural_context.map((ctx, i) => (
          <p key={`c-${i}`} className="text-on-surface-variant text-sm italic">{ctx}</p>
        ))}
        {statistics.map((stat, i) => (
          <div key={`s-${i}`} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">bar_chart</span>
            <p className="text-on-surface-variant/80 text-sm">{stat}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
