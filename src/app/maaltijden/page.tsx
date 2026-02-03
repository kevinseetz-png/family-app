"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useMeals } from "@/hooks/useMeals";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Meal } from "@/types/meal";

export default function MaaltijdenPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { meals, isLoading, error, updateMeal, deleteMeal, getRandomMeal } = useMeals(user?.familyId);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editName, setEditName] = useState("");
  const [editIngredients, setEditIngredients] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleRandomMeal = () => {
    const meal = getRandomMeal();
    if (meal) {
      setSelectedMeal(meal);
    }
  };

  const handleSelectMeal = (meal: Meal) => {
    setSelectedMeal(meal);
  };

  const handleCloseSelected = () => {
    setSelectedMeal(null);
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setEditName(meal.name);
    setEditIngredients(meal.ingredients);
    setEditInstructions(meal.instructions);
  };

  const handleCancelEdit = () => {
    setEditingMeal(null);
    setEditName("");
    setEditIngredients("");
    setEditInstructions("");
  };

  const handleSaveEdit = async () => {
    if (!editingMeal || !editName.trim()) return;

    setIsSaving(true);
    try {
      await updateMeal(editingMeal.id, {
        name: editName.trim(),
        ingredients: editIngredients,
        instructions: editInstructions,
      });
      setEditingMeal(null);
      if (selectedMeal?.id === editingMeal.id) {
        setSelectedMeal({
          ...selectedMeal,
          name: editName.trim(),
          ingredients: editIngredients,
          instructions: editInstructions,
        });
      }
    } catch (err) {
      console.error("Failed to save meal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      if (selectedMeal?.id === mealId) {
        setSelectedMeal(null);
      }
    } catch (err) {
      console.error("Failed to delete meal:", err);
    }
  };

  return (
    <main id="main-content" className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Maaltijden</h1>

      {/* Random meal button */}
      {meals.length > 0 && (
        <button
          onClick={handleRandomMeal}
          className="w-full mb-6 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
          Kies willekeurige maaltijd
        </button>
      )}

      {/* Selected meal display */}
      {selectedMeal && (
        <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold text-emerald-800">Gekozen maaltijd</h2>
            <button
              onClick={handleCloseSelected}
              className="text-emerald-600 hover:text-emerald-800"
              aria-label="Sluiten"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-3">{selectedMeal.name}</p>
          {selectedMeal.ingredients && (
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Ingrediënten</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeal.ingredients}</p>
            </div>
          )}
          {selectedMeal.instructions && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Instructies</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedMeal.instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Edit modal */}
      {editingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Maaltijd bewerken</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Naam
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label htmlFor="edit-ingredients" className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrediënten
                </label>
                <textarea
                  id="edit-ingredients"
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={isSaving}
                  placeholder="Bijv. pasta, gehakt, tomaten..."
                />
              </div>
              <div>
                <label htmlFor="edit-instructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Instructies
                </label>
                <textarea
                  id="edit-instructions"
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={isSaving}
                  placeholder="Hoe bereid je dit gerecht?"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editName.trim()}
                className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Opslaan..." : "Opslaan"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal cards */}
      {meals.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-8">
          Geen maaltijden opgeslagen. Sla eerst een maaltijd op vanuit het weekmenu.
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {meals.map((meal) => (
            <li
              key={meal.id}
              className="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectMeal(meal)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{meal.name}</p>
                  {meal.ingredients && (
                    <p className="text-sm text-gray-500 truncate mt-1">{meal.ingredients}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(meal)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={`Bewerk ${meal.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label={`Verwijder ${meal.name}`}
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
