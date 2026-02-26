"use client";

import { useState, useMemo } from "react";
import type { SupermarktResult, SupermarktId, SupermarktProduct } from "@/types/supermarkt";
import { pricePerUnit, pricePerUnitValue, quantityKey } from "@/lib/supermarkt/format";

interface SupermarktResultsProps {
  results: SupermarktResult[];
  isSearching: boolean;
  hasSearched: boolean;
  enabledSupermarkten: Set<SupermarktId>;
  autoQtyFilter?: string | null;
}

interface FlatProduct extends SupermarktProduct {
  supermarktLabel: string;
  ppu: string | null;
  ppuValue: number | null;
  qtyKey: string | null;
}

type SortMode = "price" | "unitprice";

export function SupermarktResults({ results, isSearching, hasSearched, enabledSupermarkten, autoQtyFilter }: SupermarktResultsProps) {
  const [sortMode, setSortMode] = useState<SortMode>("price");

  const allProducts: FlatProduct[] = useMemo(() =>
    results
      .filter((r) => enabledSupermarkten.has(r.supermarkt) && !r.error)
      .flatMap((r) =>
        r.products.map((p) => ({
          ...p,
          supermarktLabel: r.label,
          ppu: p.unitQuantity ? pricePerUnit(p.price, p.unitQuantity) : null,
          ppuValue: p.unitQuantity ? pricePerUnitValue(p.price, p.unitQuantity) : null,
          qtyKey: p.unitQuantity ? quantityKey(p.unitQuantity) : null,
        })),
      )
      .filter((p) => p.price > 0),
    [results, enabledSupermarkten],
  );

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

  if (allProducts.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8" aria-live="polite">
        Geen resultaten gevonden
      </p>
    );
  }

  const filtered = autoQtyFilter ? allProducts.filter((p) => p.qtyKey === autoQtyFilter) : allProducts;

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "price") {
      return a.price - b.price;
    }
    if (a.ppuValue !== null && b.ppuValue !== null) {
      return a.ppuValue - b.ppuValue;
    }
    if (a.ppuValue !== null) return -1;
    if (b.ppuValue !== null) return 1;
    return a.price - b.price;
  });

  return (
    <div aria-live="polite">
      {autoQtyFilter && filtered.length < allProducts.length && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
          Gefilterd op hoeveelheid ({filtered.length} van {allProducts.length} resultaten)
        </p>
      )}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setSortMode(sortMode === "price" ? "unitprice" : "price")}
          className="text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {sortMode === "price" ? "Sorteren op eenheidsprijs" : "Sorteren op prijs"}
        </button>
      </div>
      <ul className="space-y-2">
        {sorted.map((product) => {
          const { ppu } = product;
          return (
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
                {ppu && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{ppu}</p>
                )}
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                {product.displayPrice}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
