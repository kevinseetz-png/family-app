"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeekMenuDays, WeekMenuIngredients } from "@/types/weekmenu";

const EMPTY_DAYS: WeekMenuDays = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
const EMPTY_INGREDIENTS: WeekMenuIngredients = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };

export function useWeekMenu(familyId: string | undefined) {
  const [days, setDays] = useState<WeekMenuDays>(EMPTY_DAYS);
  const [ingredients, setIngredients] = useState<WeekMenuIngredients>(EMPTY_INGREDIENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/weekmenu");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load menu (${res.status})`);
        return;
      }
      const data = await res.json();
      setDays(data.menu.days);
      setIngredients(data.menu.ingredients ?? EMPTY_INGREDIENTS);
      setError(null);
    } catch {
      setError("Network error loading menu");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const saveMenu = useCallback(async (updatedDays: WeekMenuDays, updatedIngredients: WeekMenuIngredients) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weekmenu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: updatedDays, ingredients: updatedIngredients }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save menu");
      }
      setDays(updatedDays);
      setIngredients(updatedIngredients);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save menu";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { days, ingredients, isLoading, error, isSaving, saveMenu };
}
