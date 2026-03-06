"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupermarktFavorite } from "@/types/supermarkt";

export function useFavorites() {
  const [favorites, setFavorites] = useState<SupermarktFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/supermarkt/favorites");
      if (!res.ok) {
        setError("Favorieten laden mislukt");
        return;
      }
      const data = await res.json();
      setFavorites(data.items);
      setError(null);
    } catch {
      setError("Netwerkfout bij laden favorieten");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(async (name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/supermarkt/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.status === 409) {
        return false; // Already exists
      }

      if (!res.ok) {
        setError("Favoriet toevoegen mislukt");
        return false;
      }

      await fetchFavorites();
      return true;
    } catch {
      setError("Netwerkfout bij toevoegen favoriet");
      return false;
    }
  }, [fetchFavorites]);

  const removeFavorite = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/supermarkt/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        setError("Favoriet verwijderen mislukt");
        return;
      }

      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Netwerkfout bij verwijderen favoriet");
    }
  }, []);

  const isFavorite = useCallback(
    (name: string) => favorites.some((f) => f.name.toLowerCase() === name.toLowerCase()),
    [favorites],
  );

  return { favorites, isLoading, error, addFavorite, removeFavorite, isFavorite, refetch: fetchFavorites };
}
