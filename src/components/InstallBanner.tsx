"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import type { ReactElement } from "react";

export function InstallBanner(): ReactElement | null {
  const { isInstallable, install } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div role="status" className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm rounded-xl bg-indigo-600 p-4 shadow-lg sm:left-auto sm:right-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Install Family App</p>
          <p className="text-xs text-indigo-200">
            Add to your home screen for quick access
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-lg bg-white px-4 py-2.5 min-h-[44px] min-w-[44px] text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-white focus:outline-none"
        >
          Install
        </button>
      </div>
    </div>
  );
}
