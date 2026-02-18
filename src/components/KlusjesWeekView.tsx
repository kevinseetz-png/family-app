"use client";

import { useState, useMemo } from "react";
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

const DAY_NAMES = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

interface KlusjesWeekViewProps {
  items: KlusjesItem[];
  getItemsForDate: (date: string) => KlusjesItem[];
  onStatusChange: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function KlusjesWeekView({ items, getItemsForDate, onStatusChange }: KlusjesWeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const undatedItems = items.filter((item) => !item.date);

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevWeek}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          aria-label="Vorige week"
        >
          &#8592;
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatDayHeader(weekDates[0])} - {formatDayHeader(weekDates[6])}
        </span>
        <button
          onClick={nextWeek}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          aria-label="Volgende week"
        >
          &#8594;
        </button>
      </div>

      <div className="space-y-3">
        {weekDates.map((date, i) => {
          const dateStr = formatDateStr(date);
          const dayItems = getItemsForDate(dateStr);
          const isToday = dateStr === formatDateStr(new Date());

          return (
            <div key={dateStr} className={`rounded-lg border ${isToday ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase ${isToday ? "text-emerald-700" : "text-gray-500 dark:text-gray-400"}`}>
                  {DAY_NAMES[i]}
                </span>
                <span className={`text-sm ${isToday ? "text-emerald-700 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                  {formatDayHeader(date)}
                </span>
              </div>
              {dayItems.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Geen taken</p>
              ) : (
                <ul className="space-y-1">
                  {dayItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => {
                          const realId = item.id.includes("_") ? item.id.split("_")[0] : item.id;
                          const completionDate = item.id.includes("_") ? item.date ?? undefined : undefined;
                          onStatusChange(realId, NEXT_STATUS[item.status], completionDate);
                        }}
                        className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-xs"
                        aria-label={`Status ${item.name}: ${STATUS_LABELS[item.status]}, klik voor ${STATUS_LABELS[NEXT_STATUS[item.status]]}`}
                      >
                        {item.status === "todo" && <span className="text-gray-400" aria-hidden="true">&#9675;</span>}
                        {item.status === "bezig" && <span className="text-amber-500" aria-hidden="true">&#9201;</span>}
                        {item.status === "klaar" && <span className="text-green-600" aria-hidden="true">&#10003;</span>}
                      </button>
                      <span className={item.status === "klaar" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}>
                        {item.name}
                      </span>
                      {item.priority !== undefined && item.priority !== 2 && (
                        <span className={`text-xs ${PRIORITY_CONFIG[item.priority].color}`}>
                          {PRIORITY_CONFIG[item.priority].label}
                        </span>
                      )}
                      {item.recurrence !== "none" && (
                        <span className="text-xs text-blue-600">{RECURRENCE_LABELS[item.recurrence]}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {undatedItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zonder datum</h3>
          <ul className="space-y-1">
            {undatedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => onStatusChange(item.id, NEXT_STATUS[item.status], undefined)}
                  className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-xs"
                  aria-label={`Status ${item.name}: ${item.status}`}
                >
                  {item.status === "todo" && <span className="text-gray-400">&#9675;</span>}
                  {item.status === "bezig" && <span className="text-amber-500">&#9201;</span>}
                  {item.status === "klaar" && <span className="text-green-600">&#10003;</span>}
                </button>
                <span className={item.status === "klaar" ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}>
                  {item.name}
                </span>
                {item.priority !== undefined && item.priority !== 2 && (
                  <span className={`text-xs ${PRIORITY_CONFIG[item.priority].color}`}>
                    {PRIORITY_CONFIG[item.priority].label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
