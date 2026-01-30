"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useFeedings } from "@/hooks/useFeedings";
import { FeedingForm } from "@/components/FeedingForm";
import { FeedingList } from "@/components/FeedingList";
import { FeedingSummary } from "@/components/FeedingSummary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function FeedingPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const [displayUnit, setDisplayUnit] = useState<"ml" | "oz">("ml");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { feedings, isLoading, dailyTotalMl, timeSinceLastFeeding } = useFeedings(
    user?.familyId
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-indigo-600">Milk Tracker</h1>
        <div className="flex items-center gap-3">
          <select
            value={displayUnit}
            onChange={(e) => setDisplayUnit(e.target.value as "ml" | "oz")}
            aria-label="Display unit"
            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
          >
            <option value="ml">ml</option>
            <option value="oz">oz</option>
          </select>
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Home
          </Link>
        </div>
      </div>

      <FeedingSummary
        dailyTotalMl={dailyTotalMl}
        timeSinceLastFeeding={timeSinceLastFeeding}
        displayUnit={displayUnit}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Log a feeding</h2>
        <FeedingForm onSuccess={() => {}} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s feedings</h2>
        <FeedingList feedings={feedings} displayUnit={displayUnit} />
      </div>
    </main>
  );
}
