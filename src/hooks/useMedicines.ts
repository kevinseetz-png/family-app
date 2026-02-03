"use client";

import { useState, useEffect, useCallback } from "react";
import type { MedicineWithStatus } from "@/types/medicine";

interface MedicinesResponse {
  medicines: MedicineWithStatus[];
}

interface ErrorResponse {
  message?: string;
}

interface UseMedicinesReturn {
  medicines: MedicineWithStatus[];
  isLoading: boolean;
  error: string | null;
  addMedicine: (name: string, reminderHour: number, reminderMinute: number) => Promise<void>;
  updateMedicine: (id: string, updates: {
    name?: string;
    reminderHour?: number;
    reminderMinute?: number;
    active?: boolean;
  }) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  toggleCheck: (medicineId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMedicines(familyId: string | undefined): UseMedicinesReturn {
  const [medicines, setMedicines] = useState<MedicineWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicines = useCallback(async () => {
    if (!familyId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/medicines");
      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        setError(body.message || `Failed to load medicines (${res.status})`);
        setMedicines([]);
        return;
      }
      const data: MedicinesResponse = await res.json();
      setMedicines(data.medicines);
      setError(null);
    } catch {
      setError("Failed to load medicines");
      setMedicines([]);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const addMedicine = useCallback(async (name: string, reminderHour: number, reminderMinute: number) => {
    const res = await fetch("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, reminderHour, reminderMinute }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to add medicine");
    }

    await fetchMedicines();
  }, [fetchMedicines]);

  const updateMedicine = useCallback(async (id: string, updates: {
    name?: string;
    reminderHour?: number;
    reminderMinute?: number;
    active?: boolean;
  }) => {
    const res = await fetch("/api/medicines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to update medicine");
    }

    await fetchMedicines();
  }, [fetchMedicines]);

  const deleteMedicine = useCallback(async (id: string) => {
    const res = await fetch("/api/medicines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to delete medicine");
    }

    await fetchMedicines();
  }, [fetchMedicines]);

  const toggleCheck = useCallback(async (medicineId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    const res = await fetch("/api/medicines/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineId, date: today }),
    });

    if (!res.ok) {
      const body: ErrorResponse = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to toggle check");
    }

    await fetchMedicines();
  }, [fetchMedicines]);

  return {
    medicines,
    isLoading,
    error,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    toggleCheck,
    refetch: fetchMedicines,
  };
}
