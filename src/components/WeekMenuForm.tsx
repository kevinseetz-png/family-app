"use client";

import { useState, useCallback } from "react";
import type { WeekMenuDays, WeekMenuIngredients, DayKey } from "@/types/weekmenu";
import type { Meal } from "@/types/meal";

const DAY_LABELS: { key: DayKey; label: string; fullLabel: string }[] = [
  { key: "mon", label: "Ma", fullLabel: "Maandag" },
  { key: "tue", label: "Di", fullLabel: "Dinsdag" },
  { key: "wed", label: "Wo", fullLabel: "Woensdag" },
  { key: "thu", label: "Do", fullLabel: "Donderdag" },
  { key: "fri", label: "Vr", fullLabel: "Vrijdag" },
  { key: "sat", label: "Za", fullLabel: "Zaterdag" },
  { key: "sun", label: "Zo", fullLabel: "Zondag" },
];

const EMPTY_INGREDIENTS: WeekMenuIngredients = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };

interface WeekMenuFormProps {
  initialDays: WeekMenuDays;
  initialIngredients?: WeekMenuIngredients;
  meals?: Meal[];
  isSaving: boolean;
  onSave: (days: WeekMenuDays, ingredients: WeekMenuIngredients) => Promise<void>;
  onSaveMeal?: (name: string, ingredients: string, sourceDay: string) => Promise<void>;
}

export function WeekMenuForm({ initialDays, initialIngredients, meals = [], isSaving, onSave, onSaveMeal }: WeekMenuFormProps) {
  const [days, setDays] = useState<WeekMenuDays>(initialDays);
  const [ingredients, setIngredients] = useState<WeekMenuIngredients>(initialIngredients ?? EMPTY_INGREDIENTS);
  const [expandedDays, setExpandedDays] = useState<Set<DayKey>>(new Set());
  const [success, setSuccess] = useState(false);
  const [savingMeal, setSavingMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());

  /** Find a matching meal by name (case-insensitive) */
  const findMatchingMeal = useCallback((name: string): Meal | undefined => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return undefined;
    return meals.find((m) => m.name.toLowerCase().trim() === trimmed);
  }, [meals]);

  /** Check if a meal name already exists in the saved meals */
  const isMealAlreadySaved = useCallback((name: string): boolean => {
    return !!findMatchingMeal(name);
  }, [findMatchingMeal]);

  const handleChange = (key: DayKey, value: string) => {
    setDays((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  /** When user leaves the meal name field, auto-fill ingredients from existing meal */
  const handleBlur = (key: DayKey) => {
    const mealName = days[key].trim();
    if (!mealName) return;

    // Only auto-fill if the user hasn't already typed ingredients for this day
    if (ingredients[key]?.trim()) return;

    const match = findMatchingMeal(mealName);
    if (match?.ingredients) {
      setIngredients((prev) => ({ ...prev, [key]: match.ingredients }));
    }
  };

  const handleIngredientsChange = (key: DayKey, value: string) => {
    setIngredients((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const toggleExpand = (key: DayKey) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(days, ingredients);
      setSuccess(true);
    } catch {
      // error handled by hook
    }
  };

  const handleSaveMeal = async (key: DayKey, fullLabel: string) => {
    const mealName = days[key].trim();
    if (!mealName || !onSaveMeal) return;

    setSavingMeal(key);
    try {
      await onSaveMeal(mealName, ingredients[key] ?? "", fullLabel);
      setSavedMeals((prev) => new Set(prev).add(key));
    } catch {
      // error handled by parent
    } finally {
      setSavingMeal(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {DAY_LABELS.map(({ key, label, fullLabel }) => {
        const isExpanded = expandedDays.has(key);
        const hasIngredients = !!ingredients[key]?.trim();
        const alreadySaved = isMealAlreadySaved(days[key]);
        const isMarkedSaved = savedMeals.has(key) || alreadySaved;

        return (
          <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-3">
              <label htmlFor={`day-${key}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  id={`day-${key}`}
                  type="text"
                  maxLength={500}
                  value={days[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)}
                  placeholder="Wat eten we?"
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {onSaveMeal && (
                  <button
                    type="button"
                    onClick={() => handleSaveMeal(key, fullLabel)}
                    disabled={!days[key].trim() || savingMeal === key}
                    className={`px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      isMarkedSaved
                        ? "text-emerald-600 cursor-default"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    }`}
                    aria-label={
                      isMarkedSaved
                        ? `${days[key] || "Maaltijd"} is al opgeslagen`
                        : `Bewaar ${days[key] || "maaltijd"} als kaart`
                    }
                    title={isMarkedSaved ? "Al opgeslagen als maaltijdkaart" : "Bewaar als maaltijdkaart"}
                  >
                    {savingMeal === key ? (
                      <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : isMarkedSaved ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Collapsible ingredients toggle */}
              {days[key].trim() && (
                <button
                  type="button"
                  onClick={() => toggleExpand(key)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {hasIngredients ? "Ingrediënten bewerken" : "Ingrediënten toevoegen"}
                </button>
              )}
            </div>

            {/* Collapsible ingredients area */}
            {isExpanded && (
              <div className="px-3 pb-3">
                <textarea
                  id={`ingredients-${key}`}
                  value={ingredients[key]}
                  onChange={(e) => handleIngredientsChange(key, e.target.value)}
                  placeholder="Bijv. 500g pasta, 2 uien, 400g gehakt..."
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  aria-label={`Ingrediënten voor ${label}`}
                />
              </div>
            )}
          </div>
        );
      })}
      {success && <p className="text-sm text-emerald-600">Opgeslagen!</p>}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
      >
        {isSaving ? "Opslaan..." : "Opslaan"}
      </button>
    </form>
  );
}
