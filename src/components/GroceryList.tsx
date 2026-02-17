"use client";

import type { GroceryItem } from "@/types/grocery";

interface GroceryListProps {
  items: GroceryItem[];
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function GroceryList({ items, onToggle, onDelete }: GroceryListProps) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const sorted = [...unchecked, ...checked];

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Geen items op de lijst.</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => onToggle(item.id, !item.checked)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
            aria-label={`${item.checked ? "Vink uit" : "Vink aan"} ${item.name}`}
          />
          <span
            className={`flex-1 ${
              item.checked ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {item.name}
          </span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 dark:text-red-500 hover:text-red-600 text-sm font-medium"
            aria-label={`Verwijder ${item.name}`}
          >
            &#x2715;
          </button>
        </li>
      ))}
    </ul>
  );
}
