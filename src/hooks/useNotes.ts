"use client";

import { useState, useEffect, useCallback } from "react";
import type { Note } from "@/types/note";

interface NoteResponse {
  id: string;
  familyId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export function useNotes(familyId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch("/api/notes");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load notes (${res.status})`);
        return;
      }
      const data = await res.json();
      const results: Note[] = (data.notes as NoteResponse[]).map((n) => ({
        id: n.id,
        familyId: n.familyId,
        title: n.title,
        content: n.content,
        createdBy: n.createdBy,
        createdByName: n.createdByName,
        createdAt: new Date(n.createdAt),
      }));
      setNotes(results);
      setError(null);
    } catch {
      setError("Network error loading notes");
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete note");
    }
    await fetchNotes();
  }, [fetchNotes]);

  const updateNote = useCallback(async (data: {
    id: string;
    title: string;
    content: string;
  }) => {
    const res = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to update note");
    }
    await fetchNotes();
  }, [fetchNotes]);

  return { notes, isLoading, error, refetch: fetchNotes, deleteNote, updateNote };
}
