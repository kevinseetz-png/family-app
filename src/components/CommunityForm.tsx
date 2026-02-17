"use client";

import { useState, type FormEvent } from "react";

interface CommunityFormProps {
  onAdd: (content: string) => Promise<void>;
}

export function CommunityForm({ onAdd }: CommunityFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd(content.trim());
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon bericht niet plaatsen");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="community-content" className="sr-only">Bericht content</label>
      <textarea
        id="community-content"
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
        placeholder="Schrijf een bericht..."
        rows={3}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "..." : "Plaatsen"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
