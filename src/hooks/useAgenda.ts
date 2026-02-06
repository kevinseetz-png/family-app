"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgendaEvent, AgendaCategory, RecurrenceType } from "@/types/agenda";

interface ErrorResponse {
  message?: string;
}

interface AddEventData {
  title: string;
  description?: string;
  category: AgendaCategory;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  recurrence?: RecurrenceType;
  assignedTo?: string | null;
}

interface UpdateEventData {
  title?: string;
  description?: string;
  category?: AgendaCategory;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  recurrence?: RecurrenceType;
  assignedTo?: string | null;
}

interface UseAgendaReturn {
  events: AgendaEvent[];
  isLoading: boolean;
  error: string | null;
  addEvent: (data: AddEventData) => Promise<void>;
  updateEvent: (id: string, updates: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsForDate: (date: string) => AgendaEvent[];
  getEventsForMonth: (year: number, month: number) => AgendaEvent[];
  refetch: () => Promise<void>;
}

function expandRecurringEvents(events: AgendaEvent[], year: number, month: number): AgendaEvent[] {
  const expanded: AgendaEvent[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  for (const event of events) {
    if (event.recurrence === "none") {
      expanded.push(event);
      continue;
    }

    const eventDate = new Date(event.date + "T00:00:00");
    if (eventDate > monthEnd) continue;

    const current = new Date(eventDate);
    while (current <= monthEnd) {
      if (current >= monthStart || current.toISOString().slice(0, 10) === event.date) {
        const dateStr = current.toISOString().slice(0, 10);
        if (dateStr !== event.date) {
          expanded.push({
            ...event,
            id: `${event.id}_${dateStr}`,
            date: dateStr,
          });
        }
      }

      switch (event.recurrence) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
        case "yearly":
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    expanded.push(event);
  }

  return expanded;
}

export function useAgenda(familyId: string | undefined): UseAgendaReturn {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!familyId) {
      setIsLoading(false);
      setEvents([]);
      setError(null);
      return;
    }

    try {
      const res = await fetch("/api/agenda");
      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        setError(body.message || `Kon agenda niet laden (${res.status})`);
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents(
        data.events.map((e: AgendaEvent & { createdAt: string }) => ({
          ...e,
          createdAt: new Date(e.createdAt),
        }))
      );
      setError(null);
    } catch {
      setError("Kon agenda niet laden");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(
    async (data: AddEventData) => {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        throw new Error(body.message || "Kon afspraak niet toevoegen");
      }

      await fetchEvents();
    },
    [fetchEvents]
  );

  const updateEvent = useCallback(
    async (id: string, updates: UpdateEventData) => {
      const res = await fetch("/api/agenda", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        throw new Error(body.message || "Kon afspraak niet bijwerken");
      }

      await fetchEvents();
    },
    [fetchEvents]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const res = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({}));
        throw new Error(body.message || "Kon afspraak niet verwijderen");
      }

      await fetchEvents();
    },
    [fetchEvents]
  );

  const getEventsForDate = useCallback(
    (date: string) => {
      const d = new Date(date + "T00:00:00");
      const year = d.getFullYear();
      const month = d.getMonth();
      const expanded = expandRecurringEvents(events, year, month);
      return expanded
        .filter((e) => e.date === date)
        .sort((a, b) => {
          if (a.allDay && !b.allDay) return -1;
          if (!a.allDay && b.allDay) return 1;
          return (a.startTime || "").localeCompare(b.startTime || "");
        });
    },
    [events]
  );

  const getEventsForMonth = useCallback(
    (year: number, month: number) => {
      return expandRecurringEvents(events, year, month);
    },
    [events]
  );

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    refetch: fetchEvents,
  };
}
