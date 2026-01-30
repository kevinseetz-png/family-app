"use client";

import { useState, type FormEvent } from "react";
import type { FoodType, FeedingUnit } from "@/types/feeding";
import { FOOD_TYPE_LABELS } from "@/types/feeding";

interface FeedingFormProps {
  onSuccess: () => void;
}

const FOOD_TYPES: FoodType[] = ["breast_milk", "formula", "puree", "solid", "snack"];

export function FeedingForm({ onSuccess }: FeedingFormProps) {
  const [foodType, setFoodType] = useState<FoodType>("breast_milk");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<FeedingUnit>("ml");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodType,
          amount: parseFloat(amount),
          unit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to log feeding");
        return;
      }

      setAmount("");
      onSuccess();
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="food-type" className="block text-sm font-medium text-gray-700 mb-1">
          Food type
        </label>
        <select
          id="food-type"
          required
          value={foodType}
          onChange={(e) => setFoodType(e.target.value as FoodType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          {FOOD_TYPES.map((ft) => (
            <option key={ft} value={ft}>{FOOD_TYPE_LABELS[ft]}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            required
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="0"
          />
        </div>
        <div className="w-24">
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as FeedingUnit)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ml">ml</option>
            <option value="g">g</option>
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Logging..." : "Log feeding"}
      </button>
    </form>
  );
}
