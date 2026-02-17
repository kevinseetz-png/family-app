"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import Link from "next/link";

interface UncheckedMedicine {
  name: string;
}

export function MedicineReminder() {
  const { user } = useAuthContext();
  const [unchecked, setUnchecked] = useState<UncheckedMedicine[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function checkMedicines() {
      try {
        const res = await fetch("/api/medicines");
        if (!res.ok) return;
        const data = await res.json();
        const missed = data.medicines?.filter(
          (m: { active: boolean; checkedToday: boolean; name: string }) =>
            m.active && !m.checkedToday
        ) ?? [];
        setUnchecked(missed);
      } catch {
        // silently fail
      }
    }

    checkMedicines();
  }, [user]);

  if (!user || dismissed || unchecked.length === 0) return null;

  return (
    <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg" role="alert">
      <div className="flex items-start gap-3">
        <span className="text-amber-600 dark:text-amber-400 text-xl leading-none" aria-hidden="true">!</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {unchecked.length === 1
              ? `Vergeet niet: ${unchecked[0].name}`
              : `${unchecked.length} medicijnen nog niet genomen`}
          </p>
          {unchecked.length > 1 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {unchecked.map((m) => m.name).join(", ")}
            </p>
          )}
          <Link
            href="/medicijn"
            className="text-xs text-amber-700 dark:text-amber-300 underline hover:text-amber-900 mt-1 inline-block"
          >
            Bekijk medicijnen
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 p-1"
          aria-label="Sluiten"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
