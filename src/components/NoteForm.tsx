"use client";

import { useState, type FormEvent } from "react";

interface NoteFormProps {
  onSuccess: () => void;
}

export function NoteForm({ onSuccess }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create note");
        return;
      }

      setTitle("");
      setContent("");
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
        <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="note-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Note title"
        />
      </div>

      <div>
        <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="note-content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Write your note..."
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : "Add note"}
      </button>
    </form>
  );
}
