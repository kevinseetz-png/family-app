"use client";

interface OverdueBannerProps {
  count: number;
  onClick: () => void;
}

export function OverdueBanner({ count, onClick }: OverdueBannerProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition-colors"
      aria-label={`${count} verlopen ${count === 1 ? "taak" : "taken"} bekijken`}
    >
      <span className="text-amber-500" aria-hidden="true">&#9888;</span>
      <span className="font-medium">
        {count} verlopen {count === 1 ? "taak" : "taken"}
      </span>
      <svg className="w-4 h-4 ml-auto text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
