"use client";

import { useState, useEffect, useRef } from "react";
import type { KlusjesItem } from "@/types/klusjes";

interface OverdueTasksModalProps {
  tasks: KlusjesItem[];
  onReschedule: (id: string, newDate: string) => Promise<void>;
  onRemoveDate: (id: string) => Promise<void>;
  onClose: () => void;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export function OverdueTasksModal({ tasks, onReschedule, onRemoveDate, onClose }: OverdueTasksModalProps) {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(getToday());
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [onClose]);

  const handleReschedule = async (id: string) => {
    setBusy(true);
    try {
      await onReschedule(id, newDate);
      setReschedulingId(null);
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveDate = async (id: string) => {
    setBusy(true);
    try {
      await onRemoveDate(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="overdue-modal-title"
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-semibold text-gray-900" id="overdue-modal-title">
            Verlopen taken
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors py-1 px-2 -mr-2 rounded-lg"
            aria-label="Sluiten"
          >
            Sluiten
          </button>
        </div>

        <div className="p-5 space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="border border-amber-200 rounded-xl p-3 bg-amber-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 text-sm">{task.name}</span>
                <span className="text-xs text-amber-600">{task.date ? formatDate(task.date) : ""}</span>
              </div>

              {reschedulingId === task.id ? (
                <div className="space-y-2">
                  <label htmlFor={`reschedule-${task.id}`} className="block text-xs text-gray-500">
                    Nieuwe datum
                  </label>
                  <input
                    id={`reschedule-${task.id}`}
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReschedule(task.id)}
                      disabled={busy}
                      className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Bevestigen
                    </button>
                    <button
                      onClick={() => setReschedulingId(null)}
                      className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReschedulingId(task.id);
                      setNewDate(getToday());
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label={`${task.name} verzetten`}
                  >
                    Verzetten
                  </button>
                  <button
                    onClick={() => handleRemoveDate(task.id)}
                    disabled={busy}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    aria-label={`Datum verwijderen voor ${task.name}`}
                  >
                    Datum verwijderen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
