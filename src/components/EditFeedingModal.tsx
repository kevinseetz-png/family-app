"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Feeding, FoodType, FeedingUnit } from "@/types/feeding";
import { FOOD_TYPE_LABELS } from "@/types/feeding";

const FOOD_TYPES: FoodType[] = ["breast_milk", "formula", "puree", "solid", "snack"];

interface EditFeedingModalProps {
  feeding: Feeding;
  onSave: (data: {
    id: string;
    foodType: FoodType;
    amount: number;
    unit: FeedingUnit;
    timestamp: string;
  }) => Promise<void>;
  onClose: () => void;
}

function toLocalDatetime(date: Date): string {
  try {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
}

export function EditFeedingModal({ feeding, onSave, onClose }: EditFeedingModalProps) {
  const [foodType, setFoodType] = useState<FoodType>(feeding.foodType ?? "breast_milk");
  const [amount, setAmount] = useState(feeding.amount ?? 0);
  const [unit, setUnit] = useState<FeedingUnit>(feeding.unit ?? "ml");
  const [timestamp, setTimestamp] = useState(toLocalDatetime(feeding.timestamp));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        id: feeding.id,
        foodType,
        amount,
        unit,
        timestamp: new Date(timestamp).toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feeding");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl p-4 max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-label="Voeding bewerken"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Voeding bewerken</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="edit-food-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Soort voeding
            </label>
            <select
              id="edit-food-type"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value as FoodType)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {FOOD_TYPES.map((ft) => (
                <option key={ft} value={ft}>{FOOD_TYPE_LABELS[ft]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hoeveelheid
              </label>
              <input
                id="edit-amount"
                type="number"
                step="any"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="w-24">
              <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Eenheid
              </label>
              <select
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as FeedingUnit)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="edit-timestamp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tijd
            </label>
            <input
              id="edit-timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
