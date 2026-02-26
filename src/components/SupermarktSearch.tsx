"use client";

interface SupermarktSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SupermarktSearch({ query, onQueryChange }: SupermarktSearchProps) {
  return (
    <div className="mb-6">
      <label htmlFor="supermarkt-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Zoek product
      </label>
      <input
        id="supermarkt-search"
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="bijv. melk, kwark 1kg, yoghurt 500ml"
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}
