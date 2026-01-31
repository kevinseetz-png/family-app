"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useWeekMenu } from "@/hooks/useWeekMenu";
import { WeekMenuForm } from "@/components/WeekMenuForm";

export default function WeekMenuPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { days, isLoading, error, isSaving, saveMenu } = useWeekMenu(user?.familyId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-emerald-600 mb-6">Weekmenu</h1>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        <WeekMenuForm initialDays={days} isSaving={isSaving} onSave={saveMenu} />
      </div>
    </main>
  );
}
