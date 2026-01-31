"use client";

import { useState, useEffect, useCallback } from "react";
import type { GroceryItem } from "@/types/grocery";

interface GroceryResponse {
  id: string;
  familyId: string;
  name: string;
  checked: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export function useGroceries(familyId: string | undefined) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/groceries");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load groceries (${res.status})`);
        return;
      }
      const data = await res.json();
      const results: GroceryItem[] = (data.items as GroceryResponse[]).map((item) => ({
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
      setError("Network error loading groceries");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (name: string) => {
    const res = await fetch("/api/groceries", {
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
    const res = await fetch("/api/groceries", {
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
    const res = await fetch("/api/groceries", {
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
