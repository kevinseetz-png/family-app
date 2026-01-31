"use client";

import { useState, useEffect } from "react";

interface FeedingSummaryProps {
  feedingCount: number;
  lastFeedingTimestamp: Date | null;
}

const TIMER_INTERVAL_MS = 60_000;

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m ago`;
}

export function FeedingSummary({ feedingCount, lastFeedingTimestamp }: FeedingSummaryProps) {
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastFeedingTimestamp) {
      setMinutesAgo(null);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - lastFeedingTimestamp.getTime();
      if (isNaN(elapsed)) {
        setMinutesAgo(null);
        return;
      }
      setMinutesAgo(Math.round(elapsed / 60000));
    };

    update();
    const interval = setInterval(update, TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastFeedingTimestamp]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-gray-600">Today&apos;s feedings</p>
        <p className="text-2xl font-bold text-emerald-600">
          {feedingCount} {feedingCount === 1 ? "feeding" : "feedings"}
        </p>
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-center" role="status" aria-live="polite">
        <p className="text-sm text-gray-600">Last feeding</p>
        <p className="text-2xl font-bold text-emerald-600">
          {minutesAgo !== null ? formatDuration(minutesAgo) : <span aria-label="No feeding recorded">{"\u2014"}</span>}
        </p>
      </div>
    </div>
  );
}
