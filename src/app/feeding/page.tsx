"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useFeedings } from "@/hooks/useFeedings";
import { useFeedingHistory } from "@/hooks/useFeedingHistory";
import { useDayFeedings } from "@/hooks/useDayFeedings";
import { FeedingForm } from "@/components/FeedingForm";
import { FeedingList } from "@/components/FeedingList";
import { FeedingSummary } from "@/components/FeedingSummary";
import { FeedingHistory } from "@/components/FeedingHistory";
import { EditFeedingModal } from "@/components/EditFeedingModal";
import { VitaminCheck } from "@/components/VitaminCheck";
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

  const { feedings: dayFeedings, isLoading: dayFeedingsLoading, fetchDay } = useDayFeedings(
    user?.familyId
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayClick = useCallback((date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      fetchDay(null);
    } else {
      setSelectedDate(date);
      fetchDay(date);
    }
  }, [selectedDate, fetchDay]);

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Eten Tracker</h1>

      <div className="mb-4">
        <VitaminCheck familyId={user.familyId} />
      </div>

      <FeedingSummary
        feedingCount={feedingCount}
        lastFeedingTimestamp={lastFeedingTimestamp}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Voeding toevoegen</h2>
        <FeedingForm onSuccess={refetch} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Voedingen vandaag</h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Afgelopen 30 dagen</h2>
          <FeedingHistory
            history={history}
            isLoading={historyLoading}
            error={historyError}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            dayFeedings={dayFeedings}
            dayFeedingsLoading={dayFeedingsLoading}
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
