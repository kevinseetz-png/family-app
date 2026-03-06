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
  query?: string;
  isFavorite?: (name: string) => boolean;
  onAddFavorite?: (name: string) => void;
}

interface FlatProduct extends SupermarktProduct {
  supermarktLabel: string;
  ppu: string | null;
  ppuValue: number | null;
  qtyKey: string | null;
}

type SortMode = "price" | "unitprice";

export function SupermarktResults({ results, isSearching, hasSearched, enabledSupermarkten, autoQtyFilter, query, isFavorite, onAddFavorite }: SupermarktResultsProps) {
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

  const trimmedQuery = query?.trim() ?? "";
  const alreadyFavorite = isFavorite ? isFavorite(trimmedQuery) : false;

  return (
    <div aria-live="polite">
      {trimmedQuery && onAddFavorite && (
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {filtered.length} resultaten
          </p>
          <button
            type="button"
            onClick={() => onAddFavorite(trimmedQuery)}
            disabled={alreadyFavorite}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              alreadyFavorite
                ? "border-red-300 dark:border-red-700 text-red-400 dark:text-red-500 cursor-default"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={alreadyFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={alreadyFavorite ? 0 : 1.5} className="w-4 h-4">
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.803-2.033C3.856 12.544 2 10.28 2 7.5A4.5 4.5 0 016.5 3c1.33 0 2.568.6 3.5 1.607A5.105 5.105 0 0113.5 3 4.5 4.5 0 0118 7.5c0 2.78-1.856 5.044-3.664 6.687a22.045 22.045 0 01-3.965 2.716l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
            </svg>
            {alreadyFavorite ? "Favoriet" : "Bewaar als favoriet"}
          </button>
        </div>
      )}
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {product.name}
                  </p>
                  {product.isOnSale && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 flex-shrink-0">
                      Aanbieding
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {product.supermarktLabel}
                  {product.unitQuantity ? ` · ${product.unitQuantity}` : ""}
                </p>
                {ppu && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{ppu}</p>
                )}
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className={`text-sm font-bold ${product.isOnSale ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {product.displayPrice}
                </span>
                {product.isOnSale && product.displayWasPrice && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                    {product.displayWasPrice}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
