"use client";

import type { KlusjesItem, KlusjesStatus } from "@/types/klusjes";
import { RECURRENCE_LABELS, STATUS_CONFIG } from "@/types/klusjes";

const NEXT_STATUS: Record<KlusjesStatus, KlusjesStatus> = {
  todo: "bezig",
  bezig: "klaar",
  klaar: "todo",
};

const STATUS_LABELS: Record<KlusjesStatus, string> = {
  todo: STATUS_CONFIG.todo.label,
  bezig: STATUS_CONFIG.bezig.label,
  klaar: STATUS_CONFIG.klaar.label,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

interface KlusjesListProps {
  items: KlusjesItem[];
  onStatusChange: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function KlusjesList({ items, onStatusChange, onDelete }: KlusjesListProps) {
  const notDone = items.filter((i) => i.status !== "klaar");
  const done = items.filter((i) => i.status === "klaar");
  const sorted = [...notDone, ...done];

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">Geen klusjes op de lijst.</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
        >
          <button
            onClick={() => onStatusChange(item.id, NEXT_STATUS[item.status], undefined)}
            className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border-2 border-gray-300 text-sm"
            aria-label={`Status ${item.name}: ${STATUS_LABELS[item.status]}, klik voor ${STATUS_LABELS[NEXT_STATUS[item.status]]}`}
          >
            {item.status === "todo" && <span className="text-gray-400" aria-hidden="true">&#9675;</span>}
            {item.status === "bezig" && <span className="text-amber-500" aria-hidden="true">&#9201;</span>}
            {item.status === "klaar" && <span className="text-green-600" aria-hidden="true">&#10003;</span>}
          </button>
          <div className="flex-1 min-w-0">
            <span
              className={`block ${
                item.status === "klaar" ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {item.name}
            </span>
            <div className="flex gap-2 mt-1">
              {item.date && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {formatDate(item.date)}
                </span>
              )}
              {item.recurrence !== "none" && (
                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {RECURRENCE_LABELS[item.recurrence]}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-600 text-sm font-medium"
            aria-label={`Verwijder ${item.name}`}
          >
            &#x2715;
          </button>
        </li>
      ))}
    </ul>
  );
}
