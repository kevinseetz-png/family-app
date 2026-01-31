"use client";

import type { Feeding } from "@/types/feeding";
import { FOOD_TYPE_LABELS } from "@/types/feeding";

interface FeedingListProps {
  feedings: Feeding[];
  onDelete?: (id: string) => void;
  onEdit?: (feeding: Feeding) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export function FeedingList({ feedings, onDelete, onEdit }: FeedingListProps) {
  if (feedings.length === 0) {
    return <p className="text-gray-500 text-center py-4">Nog geen voedingen vandaag</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {feedings.map((f) => (
        <li key={f.id} className="py-3 flex justify-between items-center">
          <div>
            <span className="font-medium text-gray-900">{FOOD_TYPE_LABELS[f.foodType]}</span>
            <span className="text-gray-500 text-sm ml-2">door {f.loggedByName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-600">
              {f.amount} {f.unit}
            </span>
            <span className="text-gray-400 text-sm">{formatTime(f.timestamp)}</span>
            {onEdit && (
              <button
                onClick={() => onEdit(f)}
                aria-label={`Voeding bewerken`}
                className="ml-1 rounded p-1 text-gray-400 hover:text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm("Deze voeding verwijderen?")) {
                    onDelete(f.id);
                  }
                }}
                aria-label={`Voeding verwijderen`}
                className="rounded p-1 text-gray-400 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
