"use client";

import { useState, useEffect, useCallback } from "react";

interface VitaminStatus {
  checked: boolean;
  checkedByName?: string;
}

export function useVitamin(familyId: string | undefined) {
  const [status, setStatus] = useState<VitaminStatus>({ checked: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchStatus = useCallback(async () => {
    if (!familyId) return;

    try {
      const res = await fetch(`/api/vitamins?date=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus({ checked: data.checked, checkedByName: data.checkedByName });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [familyId, today]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggle = useCallback(async () => {
    if (!familyId || isToggling) return;
    setIsToggling(true);

    try {
      const res = await fetch("/api/vitamins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setStatus({ checked: data.checked, checkedByName: data.checkedByName });
    } catch {
      // ignore
    } finally {
      setIsToggling(false);
    }
  }, [familyId, today, isToggling]);

  return { ...status, isLoading, isToggling, toggle };
}
