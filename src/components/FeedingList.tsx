"use client";

import type { Feeding } from "@/types/feeding";

interface FeedingListProps {
  feedings: Feeding[];
  displayUnit: "ml" | "oz";
}

function formatAmount(amountMl: number, unit: "ml" | "oz"): string {
  if (unit === "oz") {
    return `${(amountMl / 29.5735).toFixed(1)} oz`;
  }
  return `${amountMl} ml`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FeedingList({ feedings, displayUnit }: FeedingListProps) {
  if (feedings.length === 0) {
    return <p className="text-gray-500 text-center py-4">No feedings logged today</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {feedings.map((f) => (
        <li key={f.id} className="py-3 flex justify-between items-center">
          <div>
            <span className="font-medium text-gray-900">{f.babyName}</span>
            <span className="text-gray-500 text-sm ml-2">by {f.loggedByName}</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-indigo-600">
              {formatAmount(f.amount, displayUnit)}
            </span>
            <span className="text-gray-400 text-sm ml-2">{formatTime(f.timestamp)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
