"use client";

import { useState } from "react";
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
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EditFeedingModal({ feeding, onSave, onClose }: EditFeedingModalProps) {
  const [foodType, setFoodType] = useState<FoodType>(feeding.foodType);
  const [amount, setAmount] = useState(feeding.amount);
  const [unit, setUnit] = useState<FeedingUnit>(feeding.unit);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
        role="dialog"
        aria-label="Edit feeding"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Feeding</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-food-type" className="block text-sm font-medium text-gray-700 mb-1">
              Food type
            </label>
            <select
              id="edit-food-type"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value as FoodType)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {FOOD_TYPES.map((ft) => (
                <option key={ft} value={ft}>{FOOD_TYPE_LABELS[ft]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                id="edit-amount"
                type="number"
                step="any"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="w-24">
              <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as FeedingUnit)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ml">ml</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="edit-timestamp" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              id="edit-timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
