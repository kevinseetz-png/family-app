"use client";

import { useState } from "react";
import type { WeekMenuDays } from "@/types/weekmenu";

const DAY_LABELS: { key: keyof WeekMenuDays; label: string; fullLabel: string }[] = [
  { key: "mon", label: "Ma", fullLabel: "Maandag" },
  { key: "tue", label: "Di", fullLabel: "Dinsdag" },
  { key: "wed", label: "Wo", fullLabel: "Woensdag" },
  { key: "thu", label: "Do", fullLabel: "Donderdag" },
  { key: "fri", label: "Vr", fullLabel: "Vrijdag" },
  { key: "sat", label: "Za", fullLabel: "Zaterdag" },
  { key: "sun", label: "Zo", fullLabel: "Zondag" },
];

interface WeekMenuFormProps {
  initialDays: WeekMenuDays;
  isSaving: boolean;
  onSave: (days: WeekMenuDays) => Promise<void>;
  onSaveMeal?: (name: string, sourceDay: string) => Promise<void>;
}

export function WeekMenuForm({ initialDays, isSaving, onSave, onSaveMeal }: WeekMenuFormProps) {
  const [days, setDays] = useState<WeekMenuDays>(initialDays);
  const [success, setSuccess] = useState(false);
  const [savingMeal, setSavingMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());

  const handleChange = (key: keyof WeekMenuDays, value: string) => {
    setDays((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(days);
      setSuccess(true);
    } catch {
      // error handled by hook
    }
  };

  const handleSaveMeal = async (key: keyof WeekMenuDays, fullLabel: string) => {
    const mealName = days[key].trim();
    if (!mealName || !onSaveMeal) return;

    setSavingMeal(key);
    try {
      await onSaveMeal(mealName, fullLabel);
      setSavedMeals((prev) => new Set(prev).add(key));
    } catch {
      // error handled by parent
    } finally {
      setSavingMeal(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {DAY_LABELS.map(({ key, label, fullLabel }) => (
        <div key={key}>
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
              placeholder="Wat eten we?"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {onSaveMeal && (
              <button
                type="button"
                onClick={() => handleSaveMeal(key, fullLabel)}
                disabled={!days[key].trim() || savingMeal === key}
                className="px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={`Bewaar ${days[key] || "maaltijd"} als kaart`}
                title="Bewaar als maaltijdkaart"
              >
                {savingMeal === key ? (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : savedMeals.has(key) ? (
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
        </div>
      ))}
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
