"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
  return "prompt" in e && "userChoice" in e;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

const IOS_DISMISS_KEY = "ios-install-dismissed";

export interface UseInstallPromptReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  install: () => Promise<boolean>;
  dismissIOSBanner: () => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    if (isIOS()) {
      const dismissed = localStorage.getItem(IOS_DISMISS_KEY);
      if (!dismissed) {
        setShowIOS(true);
        setIsInstallable(true);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (isInstallPromptEvent(e)) {
        setDeferredPrompt(e);
        setIsInstallable(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismissIOSBanner = useCallback(() => {
    localStorage.setItem(IOS_DISMISS_KEY, "1");
    setShowIOS(false);
    setIsInstallable(false);
  }, []);

  return { isInstallable, isInstalled, isIOS: showIOS, install, dismissIOSBanner };
}
