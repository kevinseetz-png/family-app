"use client";

import { useState, useEffect, useCallback } from "react";
import type { CustomCategory } from "@/types/customCategory";

interface UseCustomCategoriesReturn {
  categories: CustomCategory[];
  isLoading: boolean;
  addCategory: (data: { label: string; emoji: string; colorScheme: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCustomCategories(familyId: string | undefined): UseCustomCategoriesReturn {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!familyId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/custom-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (data: { label: string; emoji: string; colorScheme: string }) => {
    const res = await fetch("/api/custom-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to add category");
    }
    await fetchCategories();
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    const res = await fetch("/api/custom-categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete category");
    }
    await fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, addCategory, deleteCategory };
}
