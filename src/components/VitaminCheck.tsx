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
          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
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
