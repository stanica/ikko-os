'use client';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 bg-surface-elevated text-text-secondary">
        AI
      </div>
      <div className="flex gap-1 py-3 px-4 bg-surface-elevated rounded-xl shadow-sm">
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce-dot [animation-delay:-0.32s]"></span>
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce-dot [animation-delay:-0.16s]"></span>
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce-dot"></span>
      </div>
    </div>
  );
}
