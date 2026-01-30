"use client";

import { useState } from "react";
import type { WeekMenuDays } from "@/types/weekmenu";

const DAY_LABELS: { key: keyof WeekMenuDays; label: string }[] = [
  { key: "mon", label: "Ma" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Wo" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Vr" },
  { key: "sat", label: "Za" },
  { key: "sun", label: "Zo" },
];

interface WeekMenuFormProps {
  initialDays: WeekMenuDays;
  isSaving: boolean;
  onSave: (days: WeekMenuDays) => Promise<void>;
}

export function WeekMenuForm({ initialDays, isSaving, onSave }: WeekMenuFormProps) {
  const [days, setDays] = useState<WeekMenuDays>(initialDays);
  const [success, setSuccess] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {DAY_LABELS.map(({ key, label }) => (
        <div key={key}>
          <label htmlFor={`day-${key}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            id={`day-${key}`}
            type="text"
            maxLength={500}
            value={days[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="Wat eten we?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
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
