"use client";

import Image from "next/image";
import type { SupermarktResult } from "@/types/supermarkt";

interface SupermarktResultsProps {
  results: SupermarktResult[];
  isSearching: boolean;
  hasSearched: boolean;
}

function sortResults(results: SupermarktResult[]): SupermarktResult[] {
  return [...results].sort((a, b) => {
    const aHasProducts = a.products.length > 0 && !a.error;
    const bHasProducts = b.products.length > 0 && !b.error;
    if (aHasProducts && !bHasProducts) return -1;
    if (!aHasProducts && bHasProducts) return 1;

    if (aHasProducts && bHasProducts) {
      const aMin = Math.min(...a.products.map((p) => p.price));
      const bMin = Math.min(...b.products.map((p) => p.price));
      return aMin - bMin;
    }

    return 0;
  });
}

export function SupermarktResults({ results, isSearching, hasSearched }: SupermarktResultsProps) {
  if (isSearching) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
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

  const sorted = sortResults(results);

  return (
    <div className="space-y-4" aria-live="polite">
      {sorted.map((result) => (
        <div
          key={result.supermarkt}
          className={`rounded-lg border p-4 ${
            result.error
              ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          }`}
        >
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {result.label}
          </h3>

          {result.error ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{result.error}</p>
          ) : result.products.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Geen resultaten</p>
          ) : (
            <ul className="space-y-2">
              {result.products.map((product) => (
                <li key={product.id} className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain rounded flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.unitQuantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    {product.displayPrice}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
