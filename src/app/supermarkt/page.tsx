"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useSupermarktSearch } from "@/hooks/useSupermarktSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { useFavoritesComparison } from "@/hooks/useFavoritesComparison";
import { SupermarktSearch } from "@/components/SupermarktSearch";
import { SupermarktResults } from "@/components/SupermarktResults";
import { SupermarktFilter } from "@/components/SupermarktFilter";
import { FavoritesList } from "@/components/FavoritesList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ACTIVE_SUPERMARKTEN } from "@/types/supermarkt";
import type { SupermarktId } from "@/types/supermarkt";

type Tab = "zoeken" | "favorieten";

const DEFAULT_ENABLED = new Set<SupermarktId>(ACTIVE_SUPERMARKTEN);

export default function SupermarktPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { query, setQuery, results, isSearching, error, autoQtyFilter } = useSupermarktSearch();
  const [enabledSupermarkten, setEnabledSupermarkten] = useState<Set<SupermarktId>>(DEFAULT_ENABLED);
  const [activeTab, setActiveTab] = useState<Tab>("zoeken");

  const { favorites, isLoading: favoritesLoading, error: favoritesError, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { comparisons, isComparing, cachedAt, refresh: refreshComparisons } = useFavoritesComparison(favorites);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const handleToggle = useCallback((id: SupermarktId) => {
    setEnabledSupermarkten((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAddFavorite = useCallback(async (name: string) => {
    await addFavorite(name);
  }, [addFavorite]);

  const handleSearchFromFavorite = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setActiveTab("zoeken");
  }, [setQuery]);

  if (authLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
        Supermarkt
      </h1>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setActiveTab("zoeken")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "zoeken"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Zoeken
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favorieten")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "favorieten"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Favorieten
          {favorites.length > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-medium ${
              activeTab === "favorieten"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            }`}>
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "zoeken" && (
        <>
          <SupermarktSearch query={query} onQueryChange={setQuery} />
          <SupermarktFilter enabled={enabledSupermarkten} onToggle={handleToggle} />

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
              {error}
            </p>
          )}

          <SupermarktResults
            results={results}
            isSearching={isSearching}
            hasSearched={query.trim().length > 0}
            enabledSupermarkten={enabledSupermarkten}
            autoQtyFilter={autoQtyFilter}
            query={query}
            isFavorite={isFavorite}
            onAddFavorite={handleAddFavorite}
          />
        </>
      )}

      {activeTab === "favorieten" && (
        <>
          {favoritesError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
              {favoritesError}
            </p>
          )}
          <FavoritesList
            comparisons={comparisons}
            isComparing={isComparing}
            favorites={favorites}
            isLoading={favoritesLoading}
            cachedAt={cachedAt}
            onRemove={removeFavorite}
            onSearch={handleSearchFromFavorite}
            onRefresh={refreshComparisons}
          />
        </>
      )}
    </main>
  );
}
