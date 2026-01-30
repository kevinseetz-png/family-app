"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import type { ReactElement } from "react";

export function InstallBanner(): ReactElement | null {
  const { isInstallable, isIOS, install, dismissIOSBanner } = useInstallPrompt();

  if (!isInstallable) return null;

  if (isIOS) {
    return (
      <div role="status" className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm rounded-xl bg-emerald-600 p-4 shadow-lg sm:left-auto sm:right-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Install Family App</p>
            <p className="text-xs text-emerald-200 mt-1">
              Tap <span className="font-semibold">Share</span> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="inline w-3.5 h-3.5 align-text-bottom"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06L4.06 6.75h2.19a.75.75 0 010 1.5H4.06l1.344 1.347a.75.75 0 11-1.06 1.06l-2.625-2.625a.75.75 0 010-1.06l2.625-2.625a.75.75 0 011.06 0zm9.192 0a.75.75 0 011.06 0l2.625 2.625a.75.75 0 010 1.06l-2.625 2.625a.75.75 0 11-1.06-1.06l1.344-1.347h-2.19a.75.75 0 010-1.5h2.19l-1.344-1.344a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>, then <span className="font-semibold">&quot;Add to Home Screen&quot;</span>
            </p>
          </div>
          <button
            onClick={dismissIOSBanner}
            aria-label="Dismiss install banner"
            className="shrink-0 rounded-lg p-1.5 text-emerald-200 hover:text-white focus:ring-2 focus:ring-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm rounded-xl bg-emerald-600 p-4 shadow-lg sm:left-auto sm:right-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Install Family App</p>
          <p className="text-xs text-emerald-200">
            Add to your home screen for quick access
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-lg bg-white px-4 py-2.5 min-h-[44px] min-w-[44px] text-sm font-medium text-emerald-600 hover:bg-emerald-50 focus:ring-2 focus:ring-white focus:outline-none"
        >
          Install
        </button>
      </div>
    </div>
  );
}
