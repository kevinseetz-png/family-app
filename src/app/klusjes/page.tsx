"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useKlusjes } from "@/hooks/useKlusjes";
import { KlusjesForm } from "@/components/KlusjesForm";
import { KlusjesList } from "@/components/KlusjesList";
import { KlusjesWeekView } from "@/components/KlusjesWeekView";
import { OverdueBanner } from "@/components/OverdueBanner";
import { OverdueTasksModal } from "@/components/OverdueTasksModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ViewMode = "list" | "week";

export default function KlusjesPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("list");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { items, isLoading, error, addItem, updateStatus, deleteItem, getItemsForDate, getOverdueTasks, rescheduleTask } = useKlusjes(
    user?.familyId
  );
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const overdueTasks = getOverdueTasks();

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-600">Taken</h1>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1 text-sm font-medium ${
              view === "list"
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Lijst
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 text-sm font-medium ${
              view === "week"
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <KlusjesForm onAdd={addItem} />

      {overdueTasks.length > 0 && (
        <div className="mt-4">
          <OverdueBanner count={overdueTasks.length} onClick={() => setShowOverdueModal(true)} />
        </div>
      )}

      <div className="mt-6">
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
        )}
        {view === "list" ? (
          <KlusjesList
            items={items}
            onStatusChange={updateStatus}
            onDelete={deleteItem}
            onReschedule={rescheduleTask}
          />
        ) : (
          <KlusjesWeekView
            items={items}
            getItemsForDate={getItemsForDate}
            onStatusChange={updateStatus}
            onDelete={deleteItem}
          />
        )}
      </div>

      {showOverdueModal && (
        <OverdueTasksModal
          tasks={overdueTasks}
          onReschedule={async (id, newDate) => {
            await rescheduleTask(id, newDate);
          }}
          onRemoveDate={async (id) => {
            await rescheduleTask(id, null);
          }}
          onClose={() => setShowOverdueModal(false)}
        />
      )}
    </main>
  );
}
