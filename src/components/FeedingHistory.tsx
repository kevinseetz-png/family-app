"use client";

import type { Feeding } from "@/types/feeding";
import { FeedingList } from "./FeedingList";

interface DayHistory {
  date: string;
  totalMl: number;
  count: number;
}

interface FeedingHistoryProps {
  history: DayHistory[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  dayFeedings: Feeding[];
  dayFeedingsLoading: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("nl-NL", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function FeedingHistory({
  history,
  isLoading,
  error,
  selectedDate,
  onDayClick,
  dayFeedings,
  dayFeedingsLoading,
}: FeedingHistoryProps) {
  if (isLoading) {
    return <p className="text-gray-500 text-center py-4">Geschiedenis laden...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-sm text-center py-4">{error}</p>;
  }

  if (history.length === 0) {
    return <p className="text-gray-500 text-center py-4">Geen voedingsgeschiedenis</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {history.map((day) => (
        <li key={day.date}>
          <button
            onClick={() => onDayClick(day.date)}
            className="w-full py-3 flex justify-between items-center text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            <span className="text-sm text-gray-700">{formatDate(day.date)}</span>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-emerald-600">{day.totalMl} ml</span>
              <span className="text-sm text-gray-400">
                {day.count} {day.count === 1 ? "voeding" : "voedingen"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 text-gray-400 transition-transform ${selectedDate === day.date ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
          {selectedDate === day.date && (
            <div className="pb-3 pl-4">
              {dayFeedingsLoading ? (
                <p className="text-gray-500 text-sm py-2">Voedingen laden...</p>
              ) : (
                <FeedingList feedings={dayFeedings} />
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
