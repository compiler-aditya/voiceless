"use client";

export default function IdentityPromise({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <span
          className="material-symbols-outlined text-primary-container"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
        <span className="text-sm text-on-surface-variant">
          Every story is anonymous. Names and identifying details are removed.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
        </div>
        <h3 className="text-lg font-bold text-primary">Identity Promise</h3>
      </div>
      <p className="text-on-surface-variant leading-relaxed max-w-lg mx-auto">
        Every story on Voiceless is anonymous. Names, locations, workplaces, and all
        identifying details are removed before publishing. Nobody will know who you are.
        But everyone will know how you felt.
      </p>
      <p className="text-on-surface-variant/60 text-sm mt-3 italic">
        Your story. Their story. Everyone&apos;s story.
      </p>
    </div>
  );
}
