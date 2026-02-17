"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useNotes } from "@/hooks/useNotes";
import { NoteForm } from "@/components/NoteForm";
import { NoteList } from "@/components/NoteList";
import { EditNoteModal } from "@/components/EditNoteModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Note } from "@/types/note";

export default function NotesPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { notes, isLoading, error, refetch, deleteNote, updateNote } = useNotes(
    user?.familyId
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Noties</h1>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Nieuwe notitie</h2>
        <NoteForm onSuccess={refetch} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Alle notities</h2>
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <NoteList
          notes={notes}
          onDelete={deleteNote}
          onEdit={setEditingNote}
        />
      </div>

      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onSave={updateNote}
          onClose={() => setEditingNote(null)}
        />
      )}
    </main>
  );
}
