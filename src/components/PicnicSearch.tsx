"use client";

import { useState, type FormEvent } from "react";
import type { PicnicProduct } from "@/types/picnic";

interface PicnicSearchProps {
  onSearch: (query: string) => Promise<void>;
  onAddToCart: (productId: string) => void;
  products: PicnicProduct[];
  isSearching: boolean;
  hasSearched?: boolean;
}

export function PicnicSearch({ onSearch, onAddToCart, products, isSearching, hasSearched }: PicnicSearchProps) {
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;
    setAddedIds(new Set());
    await onSearch(query.trim());
  }

  function handleAddToCart(productId: string) {
    onAddToCart(productId);
    setAddedIds((prev) => new Set(prev).add(productId));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="picnic-search" className="sr-only">Zoek Picnic producten</label>
        <input
          id="picnic-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Zoek in Picnic..."
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? "Zoeken..." : "Zoeken"}
        </button>
      </form>

      {hasSearched && products.length === 0 && !isSearching && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Geen producten gevonden.</p>
      )}

      {products.length > 0 && (
        <ul className="space-y-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {product.displayPrice} &middot; {product.unitQuantity}
                </p>
              </div>
              <button
                onClick={() => handleAddToCart(product.id)}
                disabled={addedIds.has(product.id)}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Toevoegen aan mandje: ${product.name}`}
              >
                {addedIds.has(product.id) ? "Toegevoegd" : "+ Mandje"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
