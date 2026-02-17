"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useMedicines } from "@/hooks/useMedicines";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { MedicineWithStatus } from "@/types/medicine";

export default function MedicijnPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { medicines, isLoading, error, addMedicine, updateMedicine, deleteMedicine, toggleCheck } = useMedicines(user?.familyId);

  const [newName, setNewName] = useState("");
  const [newHour, setNewHour] = useState(9);
  const [newMinute, setNewMinute] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHour, setEditHour] = useState(0);
  const [editMinute, setEditMinute] = useState(0);
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await addMedicine(newName.trim(), newHour, newMinute);
      setNewName("");
      setNewHour(9);
      setNewMinute(0);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add medicine");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (medicineId: string) => {
    try {
      await toggleCheck(medicineId);
    } catch (err) {
      console.error("Failed to toggle check:", err);
    }
  };

  const handleDelete = async (medicineId: string) => {
    try {
      await deleteMedicine(medicineId);
    } catch (err) {
      console.error("Failed to delete medicine:", err);
    }
  };

  const startEdit = (medicine: MedicineWithStatus) => {
    setEditingId(medicine.id);
    setEditName(medicine.name);
    setEditHour(medicine.reminderHour);
    setEditMinute(medicine.reminderMinute);
    setEditActive(medicine.active);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateMedicine(editingId, {
        name: editName.trim(),
        reminderHour: editHour,
        reminderMinute: editMinute,
        active: editActive,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update medicine:", err);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  return (
    <main id="main-content" className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Medicijnen</h1>

      {/* Add medicine form */}
      <form onSubmit={handleAdd} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20">
        <div className="space-y-3">
          <div>
            <label htmlFor="medicine-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nieuw medicijn
            </label>
            <input
              id="medicine-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Medicijn naam"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isAdding}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="reminder-hour" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Uur
              </label>
              <select
                id="reminder-hour"
                value={newHour}
                onChange={(e) => setNewHour(Number(e.target.value))}
                disabled={isAdding}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="reminder-minute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minuut
              </label>
              <select
                id="reminder-minute"
                value={newMinute}
                onChange={(e) => setNewMinute(Number(e.target.value))}
                disabled={isAdding}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {addError && (
            <p className="text-sm text-red-600" role="alert">
              {addError}
            </p>
          )}

          <button
            type="submit"
            disabled={isAdding || !newName.trim()}
            className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? "Toevoegen..." : "Toevoegen"}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <p className="text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Medicine list */}
      {medicines.length === 0 && !error ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Geen medicijnen toegevoegd. Voeg hierboven je eerste medicijn toe.
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {medicines.map((medicine) => (
            <li
              key={medicine.id}
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 ${
                medicine.checkedToday ? "border-l-4 border-emerald-500" : ""
              } ${!medicine.active ? "opacity-60" : ""}`}
            >
              {editingId === medicine.id ? (
                // Edit mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    aria-label="Medicijn naam bewerken"
                  />
                  <div className="flex gap-3">
                    <select
                      value={editHour}
                      onChange={(e) => setEditHour(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      aria-label="Herinneringsuur"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editMinute}
                      onChange={(e) => setEditMinute(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      aria-label="Herinneringsminuut"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Herinneringen actief
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Opslaan
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={medicine.checkedToday}
                    onChange={() => handleToggle(medicine.id)}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    aria-label={`${medicine.name} ${medicine.checkedToday ? "afvinken" : "aankruisen"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-gray-900 dark:text-gray-100 ${medicine.checkedToday ? "line-through" : ""}`}>
                      {medicine.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(medicine.reminderHour, medicine.reminderMinute)}
                      {medicine.checkedToday && medicine.checkedByName && (
                        <span className="ml-2">• Genomen door {medicine.checkedByName}</span>
                      )}
                      {!medicine.active && <span className="ml-2 text-amber-600">• Gepauzeerd</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(medicine)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={`Bewerk ${medicine.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Verwijder ${medicine.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
