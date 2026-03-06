"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SupermarktFavorite, SupermarktProduct, SupermarktResult } from "@/types/supermarkt";
import { pricePerUnitValue } from "@/lib/supermarkt/format";

export interface FavoriteComparison {
  favorite: SupermarktFavorite;
  cheapest: SupermarktProduct | null;
  isSearching: boolean;
  cachedAt: string | null;
}

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useFavoritesComparison(favorites: SupermarktFavorite[]) {
  const [comparisons, setComparisons] = useState<FavoriteComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Try loading from cache first
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    if (favorites.length === 0) return false;

    try {
      const res = await fetch("/api/supermarkt/favorites/prices");
      if (!res.ok) return false;

      const data = await res.json();
      const prices = data.prices as Array<{
        favoriteId: string;
        cheapest: SupermarktProduct | null;
        cachedAt: string;
      }>;

      if (prices.length === 0) return false;

      // Check if cache is fresh enough
      const oldestCache = prices.reduce((oldest, p) => {
        const t = new Date(p.cachedAt).getTime();
        return t < oldest ? t : oldest;
      }, Infinity);

      if (Date.now() - oldestCache > CACHE_MAX_AGE_MS) return false;

      // Map cached prices to comparisons
      const priceMap = new Map(prices.map((p) => [p.favoriteId, p]));
      const cached = favorites.map((fav) => {
        const price = priceMap.get(fav.id);
        return {
          favorite: fav,
          cheapest: price?.cheapest ?? null,
          isSearching: false,
          cachedAt: price?.cachedAt ?? null,
        };
      });

      // Only use cache if we have data for at least some favorites
      const hasData = cached.some((c) => c.cheapest !== null);
      if (!hasData) return false;

      setComparisons(cached);
      setCachedAt(prices[0]?.cachedAt ?? null);
      return true;
    } catch {
      return false;
    }
  }, [favorites]);

  // Live search fallback (also used by refresh button)
  const liveCompare = useCallback(async () => {
    if (favorites.length === 0) {
      setComparisons([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsComparing(true);
    setComparisons(favorites.map((f) => ({ favorite: f, cheapest: null, isSearching: true, cachedAt: null })));

    const results = await Promise.allSettled(
      favorites.map(async (fav) => {
        const res = await fetch(
          `/api/supermarkt/search?query=${encodeURIComponent(fav.name)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return { favorite: fav, cheapest: null };

        const data = await res.json();
        const allProducts = (data.results as SupermarktResult[])
          .filter((r) => !r.error)
          .flatMap((r) => r.products)
          .filter((p) => p.price > 0)
          .sort((a, b) => {
            const ppuA = a.unitQuantity ? pricePerUnitValue(a.price, a.unitQuantity) : null;
            const ppuB = b.unitQuantity ? pricePerUnitValue(b.price, b.unitQuantity) : null;
            if (ppuA !== null && ppuB !== null) return ppuA - ppuB;
            if (ppuA !== null) return -1;
            if (ppuB !== null) return 1;
            return a.price - b.price;
          });

        return { favorite: fav, cheapest: allProducts[0] ?? null };
      }),
    );

    if (controller.signal.aborted) return;

    setComparisons(
      results.map((r, i) => {
        if (r.status === "fulfilled") {
          return { ...r.value, isSearching: false, cachedAt: null };
        }
        return { favorite: favorites[i], cheapest: null, isSearching: false, cachedAt: null };
      }),
    );
    setCachedAt(null);
    setIsComparing(false);
  }, [favorites]);

  // On mount / favorites change: try cache first, fall back to live
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsComparing(true);
      const cached = await loadFromCache();
      if (cancelled) return;

      if (cached) {
        setIsComparing(false);
      } else {
        await liveCompare();
      }
    }

    init();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [loadFromCache, liveCompare]);

  return { comparisons, isComparing, cachedAt, refresh: liveCompare };
}
