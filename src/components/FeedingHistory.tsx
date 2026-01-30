"use client";

interface DayHistory {
  date: string;
  totalMl: number;
  count: number;
}

interface FeedingHistoryProps {
  history: DayHistory[];
  isLoading: boolean;
  error: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function FeedingHistory({ history, isLoading, error }: FeedingHistoryProps) {
  if (isLoading) {
    return <p className="text-gray-500 text-center py-4">Loading history...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-sm text-center py-4">{error}</p>;
  }

  if (history.length === 0) {
    return <p className="text-gray-500 text-center py-4">No feeding history</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {history.map((day) => (
        <li key={day.date} className="py-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">{formatDate(day.date)}</span>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-emerald-600">{day.totalMl} ml</span>
            <span className="text-sm text-gray-400">
              {day.count} {day.count === 1 ? "feeding" : "feedings"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
