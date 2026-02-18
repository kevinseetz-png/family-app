"use client";

import type { SupermarktResult, SupermarktId, SupermarktProduct } from "@/types/supermarkt";

interface SupermarktResultsProps {
  results: SupermarktResult[];
  isSearching: boolean;
  hasSearched: boolean;
  enabledSupermarkten: Set<SupermarktId>;
}

interface FlatProduct extends SupermarktProduct {
  supermarktLabel: string;
}

export function SupermarktResults({ results, isSearching, hasSearched, enabledSupermarkten }: SupermarktResultsProps) {
  if (isSearching) {
    return (
      <div role="status" aria-live="polite">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Zoeken bij supermarkten...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        Zoek een product om prijzen te vergelijken
      </p>
    );
  }

  const allProducts: FlatProduct[] = results
    .filter((r) => enabledSupermarkten.has(r.supermarkt) && !r.error)
    .flatMap((r) =>
      r.products.map((p) => ({ ...p, supermarktLabel: r.label })),
    )
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price);

  if (allProducts.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8" aria-live="polite">
        Geen resultaten gevonden
      </p>
    );
  }

  return (
    <ul className="space-y-2" aria-live="polite">
      {allProducts.map((product) => (
        <li
          key={`${product.supermarkt}-${product.id}`}
          className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {product.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {product.supermarktLabel}
              {product.unitQuantity ? ` · ${product.unitQuantity}` : ""}
            </p>
          </div>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            {product.displayPrice}
          </span>
        </li>
      ))}
    </ul>
  );
}
