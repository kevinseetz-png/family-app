"use client";

import { useState } from "react";
import type { Feeding } from "@/types/feeding";

interface EditFeedingModalProps {
  feeding: Feeding;
  onSave: (data: {
    id: string;
    babyName: string;
    amount: number;
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
  const [babyName, setBabyName] = useState(feeding.babyName);
  const [amount, setAmount] = useState(feeding.amount);
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
        babyName,
        amount,
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
            <label htmlFor="edit-baby-name" className="block text-sm font-medium text-gray-700 mb-1">
              Baby name
            </label>
            <input
              id="edit-baby-name"
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ml)
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
