"use client";

import { useState, useEffect, useCallback } from "react";
import type { KlusjesItem, KlusjesStatus, KlusjesRecurrence } from "@/types/klusjes";

interface KlusjesResponse {
  id: string;
  familyId: string;
  name: string;
  status: KlusjesStatus;
  date: string | null;
  recurrence: KlusjesRecurrence;
  completions: Record<string, { status: KlusjesStatus }>;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface AddItemData {
  name: string;
  date: string | null;
  recurrence: KlusjesRecurrence;
}

interface UseKlusjesReturn {
  items: KlusjesItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addItem: (data: AddItemData) => Promise<void>;
  updateStatus: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemsForDate: (date: string) => KlusjesItem[];
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function expandRecurringKlusjes(items: KlusjesItem[], targetDate: string): KlusjesItem[] {
  const expanded: KlusjesItem[] = [];
  const target = new Date(targetDate + "T00:00:00");

  for (const item of items) {
    if (!item.date) continue;
    if (item.recurrence === "none") {
      if (item.date === targetDate) {
        expanded.push(item);
      }
      continue;
    }

    const itemDate = new Date(item.date + "T00:00:00");
    if (itemDate > target) continue;

    const current = new Date(itemDate);
    let matched = false;
    while (current <= target && !matched) {
      const dateStr = toDateStr(current);
      if (dateStr === targetDate) {
        // Check if there's a completion for this date
        const completion = item.completions[dateStr];
        if (dateStr === item.date) {
          expanded.push(item);
        } else {
          expanded.push({
            ...item,
            id: `${item.id}_${dateStr}`,
            date: dateStr,
            status: completion?.status ?? item.status,
          });
        }
        matched = true;
      }

      switch (item.recurrence) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
  }

  return expanded;
}

export function useKlusjes(familyId: string | undefined): UseKlusjesReturn {
  const [items, setItems] = useState<KlusjesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/klusjes");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load klusjes (${res.status})`);
        return;
      }
      const data = await res.json();
      const results: KlusjesItem[] = (data.items as KlusjesResponse[]).map((item) => ({
        id: item.id,
        familyId: item.familyId,
        name: item.name,
        status: item.status,
        date: item.date,
        recurrence: item.recurrence,
        completions: item.completions ?? {},
        createdBy: item.createdBy,
        createdByName: item.createdByName,
        createdAt: new Date(item.createdAt),
      }));
      setItems(results);
      setError(null);
    } catch {
      setError("Network error loading klusjes");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (data: AddItemData) => {
    const res = await fetch("/api/klusjes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to add item");
    }
    await fetchItems();
  }, [fetchItems]);

  const updateStatus = useCallback(async (id: string, status: KlusjesStatus, completionDate?: string) => {
    const payload: Record<string, unknown> = { id, status };
    if (completionDate) {
      payload.completionDate = completionDate;
    }
    const res = await fetch("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to update item");
    }
    await fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    const res = await fetch("/api/klusjes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete item");
    }
    await fetchItems();
  }, [fetchItems]);

  const getItemsForDate = useCallback((date: string) => {
    return expandRecurringKlusjes(items, date);
  }, [items]);

  return { items, isLoading, error, refetch: fetchItems, addItem, updateStatus, deleteItem, getItemsForDate };
}
