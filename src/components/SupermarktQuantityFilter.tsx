"use client";

interface QuantityOption {
  key: string;
  label: string;
  count: number;
}

interface SupermarktQuantityFilterProps {
  options: QuantityOption[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

export function SupermarktQuantityFilter({ options, selected, onSelect }: SupermarktQuantityFilterProps) {
  if (options.length <= 1) return null;

  return (
    <div className="flex gap-2 mb-3 overflow-x-auto pb-1" role="group" aria-label="Filter op hoeveelheid">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
          selected === null
            ? "bg-emerald-600 text-white border-emerald-600"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400"
        }`}
      >
        Alle
      </button>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key === selected ? null : opt.key)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            selected === opt.key
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400"
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}
