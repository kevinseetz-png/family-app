"use client";

import { useState, useCallback } from "react";
import type { Feeding, FoodType, FeedingUnit } from "@/types/feeding";

interface FeedingResponse {
  id: string;
  familyId: string;
  foodType: FoodType;
  amount: number;
  unit: FeedingUnit;
  loggedBy: string;
  loggedByName: string;
  timestamp: string;
  createdAt: string;
}

export function useDayFeedings(familyId: string | undefined) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDay = useCallback(
    async (date: string | null) => {
      if (date === null) {
        setFeedings([]);
        setIsLoading(false);
        return;
      }

      if (!familyId) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/feedings?date=${date}`);
        if (!res.ok) {
          setFeedings([]);
          return;
        }
        const data = await res.json();
        const results: Feeding[] = (data.feedings as FeedingResponse[]).map((f) => ({
          id: f.id,
          familyId: f.familyId,
          foodType: f.foodType,
          amount: f.amount,
          unit: f.unit,
          loggedBy: f.loggedBy,
          loggedByName: f.loggedByName,
          timestamp: new Date(f.timestamp),
          createdAt: new Date(f.createdAt),
        }));
        setFeedings(results);
      } catch {
        setFeedings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [familyId]
  );

  return { feedings, isLoading, fetchDay };
}
