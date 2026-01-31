"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Note } from "@/types/note";

interface EditNoteModalProps {
  note: Note;
  onSave: (data: { id: string; title: string; content: string }) => Promise<void>;
  onClose: () => void;
}

export function EditNoteModal({ note, onSave, onClose }: EditNoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave({ id: note.id, title, content });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label="Notitie bewerken"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notitie bewerken</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-note-title" className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              id="edit-note-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-note-content" className="block text-sm font-medium text-gray-700 mb-1">
              Inhoud
            </label>
            <textarea
              id="edit-note-content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
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
