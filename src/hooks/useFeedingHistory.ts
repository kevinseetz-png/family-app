"use client";

import { useState, useEffect, useCallback } from "react";

interface DayHistory {
  date: string;
  totalMl: number;
  count: number;
}

export function useFeedingHistory(familyId: string | undefined) {
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!familyId) return;

    try {
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/feedings/history?tzOffset=${tzOffset}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load history (${res.status})`);
        return;
      }
      const data = await res.json();
      setHistory(data.history as DayHistory[]);
      setError(null);
    } catch {
      setError("Network error loading history");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error };
}
