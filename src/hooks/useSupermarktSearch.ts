"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SupermarktResult } from "@/types/supermarkt";

const DEBOUNCE_MS = 500;

export function useSupermarktSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupermarktResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/supermarkt/search?query=${encodeURIComponent(query.trim())}`,
        );

        if (!res.ok) {
          setError("Zoeken mislukt");
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.results);
      } catch {
        setError("Netwerkfout bij zoeken");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  return { query, setQuery, results, isSearching, error };
}
