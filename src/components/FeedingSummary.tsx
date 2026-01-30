"use client";

interface FeedingSummaryProps {
  dailyTotalMl: number;
  timeSinceLastFeeding: number | null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m ago`;
}

export function FeedingSummary({ dailyTotalMl, timeSinceLastFeeding }: FeedingSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-gray-600">Today&apos;s total</p>
        <p className="text-2xl font-bold text-emerald-600">
          {dailyTotalMl} ml
        </p>
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-gray-600">Last feeding</p>
        <p className="text-2xl font-bold text-emerald-600">
          {timeSinceLastFeeding !== null ? formatDuration(timeSinceLastFeeding) : "\u2014"}
        </p>
      </div>
    </div>
  );
}
