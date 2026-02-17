"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useWeekMenu } from "@/hooks/useWeekMenu";
import { useMeals } from "@/hooks/useMeals";
import { WeekMenuForm } from "@/components/WeekMenuForm";

export default function WeekMenuPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { days, ingredients, isLoading, error, isSaving, saveMenu } = useWeekMenu(user?.familyId);
  const { meals, addMeal, refetch: refetchMeals } = useMeals(user?.familyId);
  const [mealError, setMealError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  const handleSaveMeal = async (name: string, mealIngredients: string, sourceDay: string) => {
    setMealError(null);
    try {
      await addMeal(name, mealIngredients, "", sourceDay);
      await refetchMeals();
    } catch (err) {
      setMealError(err instanceof Error ? err.message : "Kon maaltijd niet opslaan");
      throw err;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-emerald-600 mb-6">Weekmenu</h1>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        {mealError && <p role="alert" className="mb-4 text-sm text-red-600">{mealError}</p>}
        <WeekMenuForm
          initialDays={days}
          initialIngredients={ingredients}
          meals={meals}
          isSaving={isSaving}
          onSave={saveMenu}
          onSaveMeal={handleSaveMeal}
        />
      </div>
    </main>
  );
}
