"use client";

import { useState } from "react";
import { SUPERMARKT_LABELS } from "@/types/supermarkt";
import type { SupermarktId } from "@/types/supermarkt";

const ALL_IDS = Object.keys(SUPERMARKT_LABELS) as SupermarktId[];

interface SupermarktFilterProps {
  enabled: Set<SupermarktId>;
  onToggle: (id: SupermarktId) => void;
}

export function SupermarktFilter({ enabled, onToggle }: SupermarktFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Winkels ({enabled.size}/{ALL_IDS.length})
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {ALL_IDS.map((id) => (
            <label
              key={id}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={enabled.has(id)}
                onChange={() => onToggle(id)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {SUPERMARKT_LABELS[id]}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
