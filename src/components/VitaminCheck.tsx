"use client";

import { useVitamin } from "@/hooks/useVitamin";

interface VitaminCheckProps {
  familyId: string | undefined;
}

export function VitaminCheck({ familyId }: VitaminCheckProps) {
  const { checked, checkedByName, isLoading, isToggling, toggle } = useVitamin(familyId);

  if (isLoading) return null;

  return (
    <button
      onClick={toggle}
      disabled={isToggling}
      className={`w-full rounded-lg border-2 p-4 text-left transition-colors disabled:opacity-50 ${
        checked
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
      aria-pressed={checked}
    >
      {checked ? (
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden="true">&#x2705;</span> Vitamine gegeven
          {checkedByName && (
            <span className="text-sm font-normal text-emerald-600">
              &mdash; {checkedByName}
            </span>
          )}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span aria-hidden="true">&#x1F48A;</span> Vitamine gegeven?
        </span>
      )}
    </button>
  );
}
