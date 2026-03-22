"use client";

export default function IdentityPromise({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400">
        <span className="mr-2">🔒</span>
        Every story is anonymous. Names and identifying details are removed.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
      <div className="text-lg font-medium text-zinc-200 mb-2">🔒 Identity Promise</div>
      <p className="text-zinc-400 leading-relaxed max-w-lg mx-auto">
        Every story on Voiceless is anonymous. Names, locations, workplaces, and all
        identifying details are removed before publishing. Nobody will know who you are.
        But everyone will know how you felt.
      </p>
      <p className="text-zinc-500 text-sm mt-3 italic">
        Your story. Their story. Everyone&apos;s story.
      </p>
    </div>
  );
}
