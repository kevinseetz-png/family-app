"use client";

import { useState, useEffect, useCallback } from "react";
import type { KlusjesItem, KlusjesStatus, KlusjesRecurrence, KlusjesPriority, ReminderOption } from "@/types/klusjes";

interface KlusjesResponse {
  id: string;
  familyId: string;
  name: string;
  status: KlusjesStatus;
  priority: KlusjesPriority;
  date: string | null;
  endDate: string | null;
  recurrence: KlusjesRecurrence;
  completions: Record<string, { status: KlusjesStatus }>;
  reminder: ReminderOption | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface AddItemData {
  name: string;
  date: string | null;
  recurrence: KlusjesRecurrence;
  priority: KlusjesPriority;
  endDate?: string | null;
  reminder?: ReminderOption | null;
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
  getOverdueTasks: () => KlusjesItem[];
  rescheduleTask: (id: string, newDate: string | null) => Promise<void>;
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

    // Skip if target date is past endDate
    if (item.endDate && targetDate > item.endDate) continue;

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
        priority: item.priority ?? 2,
        date: item.date,
        endDate: item.endDate ?? null,
        recurrence: item.recurrence,
        completions: item.completions ?? {},
        reminder: item.reminder ?? null,
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

  const getOverdueTasks = useCallback(() => {
    const today = toDateStr(new Date());
    return items.filter(
      (item) => item.date && item.date < today && item.recurrence === "none" && item.status !== "klaar"
    );
  }, [items]);

  const rescheduleTask = useCallback(async (id: string, newDate: string | null) => {
    const payload: Record<string, unknown> = { id, date: newDate };
    const res = await fetch("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to reschedule task");
    }
    await fetchItems();
  }, [fetchItems]);

  return { items, isLoading, error, refetch: fetchItems, addItem, updateStatus, deleteItem, getItemsForDate, getOverdueTasks, rescheduleTask };
}
