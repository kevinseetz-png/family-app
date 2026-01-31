"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useFeedings } from "@/hooks/useFeedings";
import { useFeedingHistory } from "@/hooks/useFeedingHistory";
import { FeedingForm } from "@/components/FeedingForm";
import { FeedingList } from "@/components/FeedingList";
import { FeedingSummary } from "@/components/FeedingSummary";
import { FeedingHistory } from "@/components/FeedingHistory";
import { EditFeedingModal } from "@/components/EditFeedingModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Feeding } from "@/types/feeding";

export default function FeedingPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const [editingFeeding, setEditingFeeding] = useState<Feeding | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { feedings, isLoading, error, feedingCount, lastFeedingTimestamp, refetch, deleteFeeding, updateFeeding } = useFeedings(
    user?.familyId
  );

  const { history, isLoading: historyLoading, error: historyError } = useFeedingHistory(
    user?.familyId
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Food Tracker</h1>

      <FeedingSummary
        feedingCount={feedingCount}
        lastFeedingTimestamp={lastFeedingTimestamp}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Log a feeding</h2>
        <FeedingForm onSuccess={refetch} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Today&apos;s feedings</h2>
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <FeedingList
          feedings={feedings}
          onDelete={deleteFeeding}
          onEdit={setEditingFeeding}
        />
      </div>

      {(historyLoading || history.length > 0 || historyError) && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Past 30 days</h2>
          <FeedingHistory
            history={history}
            isLoading={historyLoading}
            error={historyError}
          />
        </div>
      )}

      {editingFeeding && (
        <EditFeedingModal
          feeding={editingFeeding}
          onSave={updateFeeding}
          onClose={() => setEditingFeeding(null)}
        />
      )}
    </main>
  );
}
