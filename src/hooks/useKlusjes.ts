"use client";

import { useState, useEffect, useCallback } from "react";
import type { KlusjesItem } from "@/types/klusjes";

interface KlusjesResponse {
  id: string;
  familyId: string;
  name: string;
  checked: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface UseKlusjesReturn {
  items: KlusjesItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addItem: (name: string) => Promise<void>;
  toggleItem: (id: string, checked: boolean) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
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
        checked: item.checked,
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

  const addItem = useCallback(async (name: string) => {
    const res = await fetch("/api/klusjes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to add item");
    }
    await fetchItems();
  }, [fetchItems]);

  const toggleItem = useCallback(async (id: string, checked: boolean) => {
    const res = await fetch("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked }),
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

  return { items, isLoading, error, refetch: fetchItems, addItem, toggleItem, deleteItem };
}
