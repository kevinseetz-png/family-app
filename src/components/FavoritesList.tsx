"use client";

import type { SupermarktFavorite } from "@/types/supermarkt";
import { SUPERMARKT_LABELS } from "@/types/supermarkt";
import type { FavoriteComparison } from "@/hooks/useFavoritesComparison";

interface FavoritesListProps {
  comparisons: FavoriteComparison[];
  isComparing: boolean;
  favorites: SupermarktFavorite[];
  isLoading: boolean;
  cachedAt: string | null;
  onRemove: (id: string) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
}

function formatCacheTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function FavoritesList({
  comparisons,
  isComparing,
  favorites,
  isLoading,
  cachedAt,
  onRemove,
  onSearch,
  onRefresh,
}: FavoritesListProps) {
  if (isLoading) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        Favorieten laden...
      </p>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Nog geen favorieten
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Zoek een product en klik op &quot;Bewaar als favoriet&quot;
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {favorites.length} {favorites.length === 1 ? "favoriet" : "favorieten"}
          </p>
          {cachedAt && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Prijzen van {formatCacheTime(cachedAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isComparing}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3.5 h-3.5 ${isComparing ? "animate-spin" : ""}`}>
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.379 2.671l-1.06 1.06A7 7 0 0015.963 12H17a.5.5 0 00.354-.854l-2-2A.5.5 0 0014.5 9.5h-.172a.5.5 0 00-.354.146l-.662.662V11.424zM4.688 8.576a5.5 5.5 0 019.379-2.671l1.06-1.06A7 7 0 004.037 8H3a.5.5 0 00-.354.854l2 2A.5.5 0 005.5 10.5h.172a.5.5 0 00.354-.146l.662-.662V8.576z" clipRule="evenodd" />
          </svg>
          Prijzen verversen
        </button>
      </div>

      <ul className="space-y-2">
        {comparisons.map((comp) => (
          <li
            key={comp.favorite.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onSearch(comp.favorite.name)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {comp.favorite.name}
                </p>
                {comp.isSearching ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Prijzen ophalen...
                  </p>
                ) : comp.cheapest ? (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${comp.cheapest.isOnSale ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {comp.cheapest.displayPrice}
                      </span>
                      {comp.cheapest.isOnSale && comp.cheapest.displayWasPrice && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                          {comp.cheapest.displayWasPrice}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        bij {SUPERMARKT_LABELS[comp.cheapest.supermarkt]}
                      </span>
                      {comp.cheapest.isOnSale && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Aanbieding
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {comp.cheapest.name}
                      {comp.cheapest.unitQuantity ? ` · ${comp.cheapest.unitQuantity}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Geen prijs gevonden
                  </p>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRemove(comp.favorite.id)}
                aria-label={`Verwijder ${comp.favorite.name}`}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.072A2.75 2.75 0 007.77 19.5h4.46a2.75 2.75 0 002.751-2.477l1.005-11.072.149.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
