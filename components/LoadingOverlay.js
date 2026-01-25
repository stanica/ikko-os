'use client';

export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 flex items-center justify-center flex-col gap-4 z-1000">
      <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-brand-500 rounded-full animate-spin"></div>
      <div className="text-gray-700 dark:text-gray-200 text-base">{message}</div>
    </div>
  );
}
