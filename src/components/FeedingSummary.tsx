"use client";

interface FeedingSummaryProps {
  dailyTotalMl: number;
  timeSinceLastFeeding: number | null;
  displayUnit: "ml" | "oz";
}

function formatTotal(ml: number, unit: "ml" | "oz"): string {
  if (unit === "oz") {
    return `${(ml / 29.5735).toFixed(1)} oz`;
  }
  return `${ml} ml`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m ago`;
}

export function FeedingSummary({ dailyTotalMl, timeSinceLastFeeding, displayUnit }: FeedingSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-gray-600">Today&apos;s total</p>
        <p className="text-2xl font-bold text-emerald-600">
          {formatTotal(dailyTotalMl, displayUnit)}
        </p>
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-center">
        <p className="text-sm text-gray-600">Last feeding</p>
        <p className="text-2xl font-bold text-emerald-600">
          {timeSinceLastFeeding !== null ? formatDuration(timeSinceLastFeeding) : "—"}
        </p>
      </div>
    </div>
  );
}
