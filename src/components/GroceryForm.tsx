"use client";

import { useState, type FormEvent } from "react";

interface GroceryFormProps {
  onAdd: (name: string) => Promise<void>;
}

export function GroceryForm({ onAdd }: GroceryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd(name.trim());
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon item niet toevoegen");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="grocery-name" className="sr-only">Item name</label>
      <input
        id="grocery-name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        placeholder="Voeg item toe..."
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "..." : "Toevoegen"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </form>
  );
}
