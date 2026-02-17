"use client";

import { useState } from "react";
import type { KlusjesItem, KlusjesStatus } from "@/types/klusjes";
import { RECURRENCE_LABELS, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/klusjes";

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

function isOverdue(item: KlusjesItem): boolean {
  if (!item.date || item.status === "klaar" || item.recurrence !== "none") return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return item.date < todayStr;
}

interface KlusjesListProps {
  items: KlusjesItem[];
  onStatusChange: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReschedule: (id: string, newDate: string | null) => Promise<void>;
}

export function KlusjesList({ items, onStatusChange, onDelete, onReschedule }: KlusjesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const notDone = items
    .filter((i) => i.status !== "klaar")
    .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
  const done = items.filter((i) => i.status === "klaar");
  const sorted = [...notDone, ...done];

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Geen taken op de lijst.</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
        >
          <button
            onClick={() => onStatusChange(item.id, NEXT_STATUS[item.status], undefined)}
            className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 text-sm"
            aria-label={`Status ${item.name}: ${STATUS_LABELS[item.status]}, klik voor ${STATUS_LABELS[NEXT_STATUS[item.status]]}`}
          >
            {item.status === "todo" && <span className="text-gray-400" aria-hidden="true">&#9675;</span>}
            {item.status === "bezig" && <span className="text-amber-500" aria-hidden="true">&#9201;</span>}
            {item.status === "klaar" && <span className="text-green-600" aria-hidden="true">&#10003;</span>}
          </button>
          <div className="flex-1 min-w-0">
            <span
              className={`block ${
                item.status === "klaar" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {item.name}
            </span>
            <div className="flex gap-2 mt-1">
              {item.priority !== undefined && item.priority !== 2 && (
                <span className={`text-xs ${PRIORITY_CONFIG[item.priority].color} ${PRIORITY_CONFIG[item.priority].bgColor} px-1.5 py-0.5 rounded`}>
                  {PRIORITY_CONFIG[item.priority].label}
                </span>
              )}
              {item.date && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isOverdue(item) ? "text-red-600 bg-red-50" : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                }`}>
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
            onClick={() => {
              setEditingId(editingId === item.id ? null : item.id);
              setEditDate(item.date || "");
            }}
            className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 text-sm"
            aria-label={`Datum wijzigen ${item.name}`}
          >
            &#x1F4C5;
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-600 text-sm font-medium"
            aria-label={`Verwijder ${item.name}`}
          >
            &#x2715;
          </button>
          {editingId === item.id && (
            <div className="w-full mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 items-center">
              <label htmlFor={`date-edit-${item.id}`} className="sr-only">Nieuwe datum</label>
              <input
                id={`date-edit-${item.id}`}
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                aria-label="Nieuwe datum"
                className="flex-1 min-w-0 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={async () => {
                  await onReschedule(item.id, editDate || null);
                  setEditingId(null);
                }}
                className="text-xs font-medium text-white bg-emerald-600 px-2 py-1 rounded hover:bg-emerald-700"
                aria-label="Opslaan"
              >
                Opslaan
              </button>
              {item.date && (
                <button
                  onClick={async () => {
                    await onReschedule(item.id, null);
                    setEditingId(null);
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                  aria-label="Datum verwijderen"
                >
                  Datum verwijderen
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
