"use client";

import { useState, useEffect, useCallback } from "react";
import type { Meal } from "@/types/meal";

interface ErrorResponse {
  message?: string;
}

interface UseMealsReturn {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
  addMeal: (name: string, ingredients: string, instructions: string, sourceDay?: string) => Promise<void>;
  updateMeal: (id: string, updates: {
    name?: string;
    ingredients?: string;
    instructions?: string;
  }) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  getRandomMeal: () => Meal | null;
  refetch: () => Promise<void>;
}

export function useMeals(familyId: string | undefined): UseMealsReturn {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/meals");
      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load meals (${res.status})`);
        setMeals([]);
        return;
      }
      const data = await res.json();
      setMeals(data.meals.map((m: Meal & { createdAt: string }) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      })));
      setError(null);
    } catch {
      setError("Failed to load meals");
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = useCallback(async (name: string, ingredients: string, instructions: string, sourceDay?: string) => {
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ingredients, instructions, sourceDay }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to add meal");
    }

    await fetchMeals();
  }, [fetchMeals]);

  const updateMeal = useCallback(async (id: string, updates: {
    name?: string;
    ingredients?: string;
    instructions?: string;
  }) => {
    const res = await fetch("/api/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to update meal");
    }

    await fetchMeals();
  }, [fetchMeals]);

  const deleteMeal = useCallback(async (id: string) => {
    const res = await fetch("/api/meals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete meal");
    }

    await fetchMeals();
  }, [fetchMeals]);

  const getRandomMeal = useCallback(() => {
    if (meals.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * meals.length);
    return meals[randomIndex];
  }, [meals]);

  return {
    meals,
    isLoading,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    getRandomMeal,
    refetch: fetchMeals,
  };
}
