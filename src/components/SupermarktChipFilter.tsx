"use client";

export interface ChipOption {
  key: string;
  label: string;
  count: number;
}

interface SupermarktChipFilterProps {
  label: string;
  options: ChipOption[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

export function SupermarktChipFilter({ label, options, selected, onSelect }: SupermarktChipFilterProps) {
  if (options.length <= 1) return null;

  return (
    <div className="mb-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label={`Filter op ${label.toLowerCase()}`}>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
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
            className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selected === opt.key
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400"
            }`}
          >
            {opt.label} ({opt.count})
          </button>
        ))}
      </div>
    </div>
  );
}
