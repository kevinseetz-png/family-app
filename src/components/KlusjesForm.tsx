"use client";

import { useState, type FormEvent } from "react";
import type { KlusjesRecurrence, KlusjesPriority } from "@/types/klusjes";
import { RECURRENCE_LABELS, PRIORITY_CONFIG } from "@/types/klusjes";

interface AddItemData {
  name: string;
  date: string | null;
  recurrence: KlusjesRecurrence;
  recurrenceInterval?: number;
  priority: KlusjesPriority;
  endDate?: string | null;
}

interface KlusjesFormProps {
  onAdd: (data: AddItemData) => Promise<void>;
}

export function KlusjesForm({ onAdd }: KlusjesFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [recurrence, setRecurrence] = useState<KlusjesRecurrence>("none");
  const [priority, setPriority] = useState<KlusjesPriority>(2);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [weeks, setWeeks] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd({
        name: name.trim(),
        date: date || null,
        recurrence,
        recurrenceInterval: recurrence !== "none" ? recurrenceInterval : 1,
        priority,
        endDate: recurrence !== "none" ? (endDate || null) : null,
      });
      setName("");
      setDate("");
      setRecurrence("none");
      setRecurrenceInterval(1);
      setPriority(2);
      setEndDate("");
      setWeeks("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon taak niet toevoegen");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="klusje-name" className="sr-only">Taak naam</label>
        <input
          id="klusje-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Voeg taak toe..."
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "..." : "Toevoegen"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-emerald-600 hover:text-emerald-700 mt-2"
        aria-expanded={expanded}
        aria-controls="klusje-options"
      >
        {expanded ? "Minder opties" : "Meer opties"}
      </button>

      {expanded && (
        <div id="klusje-options" className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label htmlFor="klusje-date" className="block text-sm font-medium text-gray-700">
              Datum
            </label>
            <input
              id="klusje-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="klusje-recurrence" className="block text-sm font-medium text-gray-700">
              Herhaling
            </label>
            <select
              id="klusje-recurrence"
              value={recurrence}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "none" || val === "daily" || val === "weekly" || val === "monthly") {
                  setRecurrence(val);
                }
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {recurrence !== "none" && (
            <div className="space-y-2">
              <div>
                <label htmlFor="klusje-interval" className="block text-sm font-medium text-gray-700">
                  Elke
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="klusje-interval"
                    type="number"
                    min={1}
                    max={52}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">
                    {recurrence === "daily" ? (recurrenceInterval === 1 ? "dag" : "dagen") : recurrence === "weekly" ? (recurrenceInterval === 1 ? "week" : "weken") : (recurrenceInterval === 1 ? "maand" : "maanden")}
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="klusje-enddate" className="block text-sm font-medium text-gray-700">
                  Loopt tot
                </label>
                <input
                  id="klusje-enddate"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setWeeks(""); }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="klusje-weeks" className="block text-sm font-medium text-gray-700">
                  Aantal weken
                </label>
                <input
                  id="klusje-weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={weeks}
                  onChange={(e) => {
                    const w = e.target.value;
                    setWeeks(w);
                    if (w && date) {
                      const start = new Date(date + "T00:00:00");
                      start.setDate(start.getDate() + parseInt(w) * 7);
                      const y = start.getFullYear();
                      const m = String(start.getMonth() + 1).padStart(2, "0");
                      const d = String(start.getDate()).padStart(2, "0");
                      setEndDate(`${y}-${m}-${d}`);
                    } else if (w) {
                      const start = new Date();
                      start.setDate(start.getDate() + parseInt(w) * 7);
                      const y = start.getFullYear();
                      const m = String(start.getMonth() + 1).padStart(2, "0");
                      const d = String(start.getDate()).padStart(2, "0");
                      setEndDate(`${y}-${m}-${d}`);
                    }
                  }}
                  placeholder="bijv. 4"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</span>
            <div className="flex gap-2">
              {([1, 2, 3] as KlusjesPriority[]).map((p) => {
                const config = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                      priority === p
                        ? `${config.bgColor} ${config.color} border-current`
                        : "bg-white text-gray-500 border-gray-300"
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
