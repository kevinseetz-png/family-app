"use client";

import type { KlusjesItem, KlusjesStatus } from "@/types/klusjes";
import { RECURRENCE_LABELS, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/klusjes";

const NEXT_STATUS: Record<KlusjesStatus, KlusjesStatus> = {
  todo: "bezig",
  bezig: "klaar",
  klaar: "todo",
};

interface TaskCardProps {
  item: KlusjesItem;
  onStatusChange: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  onEdit?: (item: KlusjesItem) => void;
}

export function TaskCard({ item, onStatusChange, onEdit }: TaskCardProps) {
  const handleClick = () => {
    const realId = item.id.includes("_") ? item.id.split("_")[0] : item.id;
    const completionDate = item.id.includes("_") ? item.date ?? undefined : undefined;
    onStatusChange(realId, NEXT_STATUS[item.status], completionDate);
  };

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
      <button
        onClick={handleClick}
        className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full border-2 border-emerald-300 text-sm"
        aria-label={`Status ${item.name}: ${STATUS_CONFIG[item.status].label}, klik voor ${STATUS_CONFIG[NEXT_STATUS[item.status]].label}`}
      >
        {item.status === "todo" && <span className="text-gray-400" aria-hidden="true">&#9675;</span>}
        {item.status === "bezig" && <span className="text-amber-500" aria-hidden="true">&#9201;</span>}
        {item.status === "klaar" && <span className="text-green-600" aria-hidden="true">&#10003;</span>}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`block text-sm ${item.status === "klaar" ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.name}
        </span>
        <div className="flex gap-1.5 mt-0.5">
          {item.time && (
            <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
              {item.time}
            </span>
          )}
          {item.priority !== undefined && item.priority !== 2 && (
            <span className={`text-xs ${PRIORITY_CONFIG[item.priority].color} ${PRIORITY_CONFIG[item.priority].bgColor} px-1 py-0.5 rounded`}>
              {PRIORITY_CONFIG[item.priority].label}
            </span>
          )}
          {item.recurrence !== "none" && (
            <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
              {RECURRENCE_LABELS[item.recurrence]}
            </span>
          )}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
          aria-label={`Bewerk ${item.name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
      )}
    </div>
  );
}
