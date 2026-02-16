"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { KlusjesRecurrence, KlusjesPriority, ReminderOption } from "@/types/klusjes";
import { RECURRENCE_LABELS, PRIORITY_CONFIG, REMINDER_OPTIONS } from "@/types/klusjes";

interface AddTaskData {
  name: string;
  date: string | null;
  recurrence: KlusjesRecurrence;
  priority: KlusjesPriority;
  recurrenceInterval?: number;
  endDate?: string | null;
  reminder?: ReminderOption | null;
}

interface AddTaskModalProps {
  selectedDate: string;
  onSave: (data: AddTaskData) => Promise<void>;
  onClose: () => void;
}

export function AddTaskModal({ selectedDate, onSave, onClose }: AddTaskModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [recurrence, setRecurrence] = useState<KlusjesRecurrence>("none");
  const [priority, setPriority] = useState<KlusjesPriority>(2);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [weeks, setWeeks] = useState("");
  const [reminder, setReminder] = useState<ReminderOption | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        date: date || null,
        recurrence,
        recurrenceInterval: recurrence !== "none" ? recurrenceInterval : 1,
        priority,
        endDate: recurrence !== "none" ? (endDate || null) : null,
        reminder: reminder || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors py-1 px-2 -ml-2 rounded-lg"
            aria-label="Annuleren"
          >
            Annuleren
          </button>
          <h2 className="font-semibold text-gray-900" id="task-modal-title">
            Nieuwe taak
          </h2>
          <button
            onClick={() => handleSubmit()}
            disabled={isSaving || !name.trim()}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-all py-1 px-2 -mr-2 rounded-lg hover:bg-emerald-50"
            aria-label={isSaving ? "Opslaan..." : "Bewaar taak"}
          >
            {isSaving ? "..." : "Bewaar"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Taaknaam"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-300 border-0 border-b-2 border-gray-100 focus:border-emerald-500 focus:ring-0 pb-2 outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-date" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Datum
            </label>
            <input
              id="task-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="task-recurrence" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Herhaling
            </label>
            <select
              id="task-recurrence"
              value={recurrence}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "none" || val === "daily" || val === "weekly" || val === "monthly") {
                  setRecurrence(val);
                }
              }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {recurrence !== "none" && (
            <>
              <div>
                <label htmlFor="task-interval" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Elke
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="task-interval"
                    type="number"
                    min={1}
                    max={52}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">
                    {recurrence === "daily" ? (recurrenceInterval === 1 ? "dag" : "dagen") : recurrence === "weekly" ? (recurrenceInterval === 1 ? "week" : "weken") : (recurrenceInterval === 1 ? "maand" : "maanden")}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="task-enddate" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Loopt tot
                </label>
                <input
                  id="task-enddate"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setWeeks(""); }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="task-weeks" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Of aantal weken
                </label>
                <input
                  id="task-weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) => {
                    const w = e.target.value;
                    setWeeks(w);
                    if (w) {
                      const start = new Date((date || new Date().toISOString().slice(0, 10)) + "T00:00:00");
                      start.setDate(start.getDate() + parseInt(w) * 7);
                      const y = start.getFullYear();
                      const m = String(start.getMonth() + 1).padStart(2, "0");
                      const d = String(start.getDate()).padStart(2, "0");
                      setEndDate(`${y}-${m}-${d}`);
                    }
                  }}
                  placeholder="bijv. 4"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="task-reminder" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Herinnering
            </label>
            <select
              id="task-reminder"
              value={reminder}
              onChange={(e) => setReminder(e.target.value as ReminderOption | "")}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Geen</option>
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span id="priority-group-label" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Prioriteit</span>
            <div className="flex gap-2" role="group" aria-labelledby="priority-group-label">
              {([1, 2, 3] as KlusjesPriority[]).map((p) => {
                const config = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    aria-pressed={priority === p}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      priority === p
                        ? `${config.bgColor} ${config.color} border-current`
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
