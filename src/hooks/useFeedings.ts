"use client";

import { useState, useEffect, useCallback } from "react";
import type { Feeding } from "@/types/feeding";

interface FeedingResponse {
  id: string;
  familyId: string;
  babyName: string;
  amount: number;
  unit: "ml" | "oz";
  loggedBy: string;
  loggedByName: string;
  timestamp: string;
  createdAt: string;
}

export function useFeedings(familyId: string | undefined) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedings = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/feedings");
      if (!res.ok) return;
      const data = await res.json();
      const results: Feeding[] = (data.feedings as FeedingResponse[]).map((f) => ({
        id: f.id,
        familyId: f.familyId,
        babyName: f.babyName,
        amount: f.amount,
        unit: f.unit,
        loggedBy: f.loggedBy,
        loggedByName: f.loggedByName,
        timestamp: new Date(f.timestamp),
        createdAt: new Date(f.createdAt),
      }));
      setFeedings(results);
    } catch {
      // Network error — keep existing data
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchFeedings();
  }, [fetchFeedings]);

  const dailyTotalMl = feedings.reduce((sum, f) => sum + f.amount, 0);

  const lastFeeding = feedings.length > 0 ? feedings[0] : null;
  const timeSinceLastFeeding = lastFeeding
    ? Math.round((Date.now() - lastFeeding.timestamp.getTime()) / 60000)
    : null;

  return { feedings, isLoading, dailyTotalMl, lastFeeding, timeSinceLastFeeding, refetch: fetchFeedings };
}
