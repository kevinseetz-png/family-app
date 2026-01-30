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
  const [error, setError] = useState<string | null>(null);

  const fetchFeedings = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/feedings");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load feedings (${res.status})`);
        return;
      }
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
      setError(null);
    } catch {
      setError("Network error loading feedings");
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

  const deleteFeeding = useCallback(async (id: string) => {
    const res = await fetch("/api/feedings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete feeding");
    }
    await fetchFeedings();
  }, [fetchFeedings]);

  const updateFeeding = useCallback(async (data: {
    id: string;
    babyName: string;
    amount: number;
    unit: "ml" | "oz";
    timestamp: string;
  }) => {
    const res = await fetch("/api/feedings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to update feeding");
    }
    await fetchFeedings();
  }, [fetchFeedings]);

  return { feedings, isLoading, error, dailyTotalMl, lastFeeding, timeSinceLastFeeding, refetch: fetchFeedings, deleteFeeding, updateFeeding };
}
