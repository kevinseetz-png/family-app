"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useAgenda } from "@/hooks/useAgenda";
import { useKlusjes } from "@/hooks/useKlusjes";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import type { KlusjesItem, KlusjesStatus, ReminderOption } from "@/types/klusjes";
import { REMINDER_OPTIONS } from "@/types/klusjes";
import {
  CATEGORY_CONFIG,
  BUILT_IN_CATEGORIES,
  DEFAULT_BIRTHDAY_GROUPS,
  getCategoryConfig,
  type BuiltInCategory,
  type AgendaCategory,
  type AgendaEvent,
  type RecurrenceType,
} from "@/types/agenda";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { CategoryManager } from "@/components/CategoryManager";
import type { CustomCategory } from "@/types/customCategory";

const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const DAYS_FULL_NL = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const MONTHS_NL = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

const ALL_BUILT_IN_CATEGORIES: BuiltInCategory[] = BUILT_IN_CATEGORIES;

type ViewMode = "dag" | "week";

/** Map category to a Tailwind bg color class for the thin vertical line in week view */
function getCategoryLineColor(category: AgendaCategory): string {
  const map: Record<AgendaCategory, string> = {
    familie: "bg-purple-400",
    werk: "bg-blue-400",
    school: "bg-amber-400",
    gezondheid: "bg-red-400",
    sport: "bg-green-400",
    verjaardag: "bg-pink-400",
    afspraak: "bg-teal-400",
    overig: "bg-gray-400",
  };
  return map[category];
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Eenmalig",
  daily: "Dagelijks",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
  yearly: "Jaarlijks",
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    days.push({
      date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

function formatTimeDisplay(time: string): string {
  // Display "HH:MM" as-is (24h is standard in Dutch)
  return time.replace(/^0/, "");
}

/** Returns the next upcoming whole hour as "HH:00", or "09:00" if past 22:00 */
function getSmartDefaultStartTime(): string {
  const now = new Date();
  let nextHour = now.getHours() + 1;
  if (nextHour > 22) nextHour = 9;
  return `${String(nextHour).padStart(2, "0")}:00`;
}

function getSmartDefaultEndTime(startTime: string): string {
  const [h] = startTime.split(":").map(Number);
  const endH = Math.min(h + 1, 23);
  return `${String(endH).padStart(2, "0")}:00`;
}

/** Check if two time-ranged events overlap */
function eventsOverlap(a: AgendaEvent, b: AgendaEvent): boolean {
  if (a.allDay || b.allDay || !a.startTime || !b.startTime) return false;
  const aStart = a.startTime;
  const aEnd = a.endTime || a.startTime;
  const bStart = b.startTime;
  const bEnd = b.endTime || b.startTime;
  return aStart < bEnd && bStart < aEnd;
}

/** Get set of event IDs that have time conflicts */
function getConflictingEventIds(events: AgendaEvent[]): Set<string> {
  const conflicting = new Set<string>();
  const timed = events.filter((e) => !e.allDay && e.startTime);
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (eventsOverlap(timed[i], timed[j])) {
        conflicting.add(timed[i].id);
        conflicting.add(timed[j].id);
      }
    }
  }
  return conflicting;
}

// ─── Mini Calendar ──────────────────────────────────────────
const MiniCalendar = memo(function MiniCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  eventDates,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  eventDates: Map<string, AgendaCategory[]>;
}) {
  const today = getToday();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 animate-expandDown">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
          aria-label="Vorige maand"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {MONTHS_NL[month]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
          aria-label="Volgende maand"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {DAYS_NL.map((day) => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map(({ date, day, isCurrentMonth }) => {
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const categories = eventDates.get(date) || [];
          const hasEvents = categories.length > 0;

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`
                relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-200 min-h-[2.25rem] sm:min-h-[2.5rem]
                ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}
                ${isToday && !isSelected ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 font-bold ring-1 ring-emerald-200 dark:ring-emerald-700" : ""}
                ${isSelected ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200 scale-105" : ""}
                ${!isSelected && isCurrentMonth ? "hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100" : ""}
              `}
              aria-label={`${day} ${MONTHS_NL[parseInt(date.slice(5, 7), 10) - 1]} ${date.slice(0, 4)}`}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
              {/* Event dots */}
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {categories.slice(0, 3).map((cat, i) => (
                    <span
                      key={i}
                      className={`block w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white/80" : getCategoryDotColor(cat)
                      }`}
                    />
                  ))}
                  {categories.length > 3 && (
                    <span className={`block w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/50" : "bg-gray-300 dark:bg-gray-600"}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <button
        onClick={onGoToToday}
        className="mt-3 w-full py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 rounded-xl transition-colors"
        aria-label="Ga naar vandaag"
      >
        Vandaag
      </button>
    </div>
  );
});

function getCategoryDotColor(category: AgendaCategory): string {
  const map: Record<AgendaCategory, string> = {
    familie: "bg-purple-400",
    werk: "bg-blue-400",
    school: "bg-amber-400",
    gezondheid: "bg-red-400",
    sport: "bg-green-400",
    verjaardag: "bg-pink-400",
    afspraak: "bg-teal-400",
    overig: "bg-gray-400",
  };
  return map[category];
}

// ─── Day Header ─────────────────────────────────────────────
function DayHeader({
  date,
  eventCount,
  onPrevDay,
  onNextDay,
}: {
  date: string;
  eventCount: number;
  onPrevDay: () => void;
  onNextDay: () => void;
}) {
  const d = new Date(date + "T00:00:00");
  const today = getToday();
  const isToday = date === today;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const isTomorrow = date === tomorrowStr;

  const dayName = d.toLocaleDateString("nl-NL", { weekday: "long" });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString("nl-NL", { month: "long" });

  return (
    <div className="mb-5 mt-2">
      <div className="flex items-center gap-2">
        {/* Previous day button */}
        <button
          onClick={onPrevDay}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Vorige dag"
        >
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isToday && (
            <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-sm flex-shrink-0">
              Vandaag
            </span>
          )}
          {isTomorrow && (
            <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-sm flex-shrink-0">
              Morgen
            </span>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            <span className="capitalize">{dayName}</span> {dayNum} {monthName}
          </h2>
        </div>

        {/* Next day button */}
        <button
          onClick={onNextDay}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Volgende dag"
        >
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {eventCount > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-9">
          {eventCount} {eventCount === 1 ? "afspraak" : "afspraken"}
        </p>
      )}
    </div>
  );
}

// ─── Event Card ─────────────────────────────────────────────
const EventCard = memo(function EventCard({
  event,
  onEdit,
  onDelete,
  index = 0,
  hasConflict = false,
  customCategories,
}: {
  event: AgendaEvent;
  onEdit: (event: AgendaEvent) => void;
  onDelete: (id: string) => void;
  index?: number;
  hasConflict?: boolean;
  customCategories?: CustomCategory[];
}) {
  const config = getCategoryConfig(event.category, customCategories);
  const [showActions, setShowActions] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Check if event is happening now
  const isHappeningNow = useMemo(() => {
    const todayStr = getToday();
    if (event.date !== todayStr || event.allDay || !event.startTime || !event.endTime) return false;
    const now = new Date();
    const [sh, sm] = event.startTime.split(":").map(Number);
    const [eh, em] = event.endTime.split(":").map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= sh * 60 + sm && nowMins <= eh * 60 + em;
  }, [event.date, event.allDay, event.startTime, event.endTime]);

  const handleToggleActions = useCallback(() => {
    setShowActions((prev) => !prev);
    setConfirmingDelete(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowActions((prev) => !prev);
      setConfirmingDelete(false);
    }
  }, []);

  return (
    <div
      className={`relative group rounded-xl border-l-4 ${config.borderColor} ${config.bgColor} p-3.5 transition-all duration-200 hover:shadow-md active:scale-[0.98] animate-fadeInUp ${isHappeningNow ? "ring-2 ring-emerald-400 ring-offset-1 shadow-md" : ""} ${hasConflict ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
      onClick={handleToggleActions}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${event.title}${event.allDay ? ", hele dag" : event.startTime ? `, ${event.startTime}${event.endTime ? " tot " + event.endTime : ""}` : ""}`}
      aria-expanded={showActions}
    >
      {/* "Nu bezig" indicator */}
      {isHappeningNow && (
        <div className="absolute -top-2 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
          Nu
        </div>
      )}

      {/* Conflict warning badge */}
      {hasConflict && !isHappeningNow && (
        <div className="absolute -top-2 right-3 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm animate-conflictPulse flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Overlap
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-lg flex-shrink-0">{config.emoji}</span>
            <h3 className={`font-semibold text-sm ${config.color} truncate`}>{event.title}</h3>
          </div>

          {/* Time */}
          {!event.allDay && event.startTime && (
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-8 flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeDisplay(event.startTime)}
              {event.endTime && ` - ${formatTimeDisplay(event.endTime)}`}
            </p>
          )}
          {event.allDay && (
            <p className="text-xs text-gray-400 dark:text-gray-500 ml-8 flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
              Hele dag
            </p>
          )}

          {/* Birthday age */}
          {event.category === "verjaardag" && event.birthYear && /^\d{4}/.test(event.date) && (
            (() => {
              const age = parseInt(event.date.slice(0, 4), 10) - event.birthYear;
              return age > 0 ? (
                <p className="text-xs text-pink-600 font-medium mt-1 ml-8">
                  Wordt {age} jaar
                </p>
              ) : null;
            })()
          )}

          {/* Description preview */}
          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-8 line-clamp-2 leading-relaxed">{event.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 ml-8">
            {event.birthdayGroup && (
              <span className="inline-flex items-center gap-1 text-[11px] text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-md">
                {event.birthdayGroup}
              </span>
            )}
            {event.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-gray-800/60 px-1.5 py-0.5 rounded-md">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {RECURRENCE_LABELS[event.recurrence]}
              </span>
            )}
            {event.assignedTo && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-gray-800/60 px-1.5 py-0.5 rounded-md">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {event.assignedTo}
              </span>
            )}
            <span className="text-[11px] text-gray-300 dark:text-gray-600">{event.createdByName}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-700/50 animate-fadeIn">
          {confirmingDelete ? (
            <div className="animate-confirmSlide">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">Weet je het zeker?</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors shadow-sm"
                  aria-label="Annuleer verwijderen"
                >
                  Nee, terug
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(event.id); setConfirmingDelete(false); setShowActions(false); }}
                  className="flex-1 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
                  aria-label={`Verwijder ${event.title}`}
                >
                  Ja, verwijder
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors shadow-sm"
                aria-label={`Bewerk ${event.title}`}
              >
                Bewerken
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                className="flex-1 py-2 text-xs font-medium text-red-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 transition-colors shadow-sm"
                aria-label={`Verwijder ${event.title}`}
              >
                Verwijderen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Empty State Illustration ────────────────────────────────
function EmptyStateIllustration() {
  return (
    <div className="text-center py-14 px-6">
      {/* Animated calendar illustration using pure SVG */}
      <div className="relative inline-block mb-6 animate-gentleFloat">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto drop-shadow-lg">
          {/* Calendar body */}
          <rect x="15" y="30" width="90" height="75" rx="12" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="2" />
          {/* Calendar top bar */}
          <rect x="15" y="30" width="90" height="24" rx="12" fill="#10B981" />
          <rect x="15" y="42" width="90" height="12" fill="#10B981" />
          {/* Calendar rings */}
          <rect x="38" y="22" width="4" height="16" rx="2" fill="#6EE7B7" />
          <rect x="78" y="22" width="4" height="16" rx="2" fill="#6EE7B7" />
          {/* Calendar grid dots */}
          <circle cx="40" cy="66" r="4" fill="#D1FAE5" />
          <circle cx="60" cy="66" r="4" fill="#D1FAE5" />
          <circle cx="80" cy="66" r="4" fill="#D1FAE5" />
          <circle cx="40" cy="86" r="4" fill="#D1FAE5" />
          <circle cx="60" cy="86" r="4" fill="#A7F3D0" />
          <circle cx="80" cy="86" r="4" fill="#D1FAE5" />
          {/* Sparkle */}
          <path d="M98 20L100 26L106 28L100 30L98 36L96 30L90 28L96 26Z" fill="#FCD34D" opacity="0.8" />
          <path d="M22 65L23.5 69L27.5 70.5L23.5 72L22 76L20.5 72L16.5 70.5L20.5 69Z" fill="#C4B5FD" opacity="0.6" />
        </svg>
      </div>
      <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-base mb-1.5">Vrije dag!</h3>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-1">Geen afspraken gepland</p>
      <p className="text-gray-300 dark:text-gray-600 text-xs">Tik op <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold mx-0.5">+</span> om iets toe te voegen</p>
    </div>
  );
}

// ─── Today Summary Widget ────────────────────────────────────
const TodaySummary = memo(function TodaySummary({ events }: { events: AgendaEvent[] }) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Find the next upcoming timed event that hasn't ended yet
  const upcoming = events
    .filter((e) => {
      if (e.allDay || !e.startTime) return false;
      const [eh, em] = (e.endTime || e.startTime).split(":").map(Number);
      return eh * 60 + em > nowMins;
    })
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  const nextEvent = upcoming[0] || null;
  const totalCount = events.length;

  if (totalCount === 0) return null;

  return (
    <div className="mb-4 px-3.5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-700 rounded-xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">
            {totalCount} {totalCount === 1 ? "afspraak" : "afspraken"} vandaag
          </p>
          {nextEvent ? (
            <p className="text-xs text-emerald-600 mt-0.5 truncate">
              Volgende: <span className="font-medium">{nextEvent.title}</span> om {nextEvent.startTime}
            </p>
          ) : (
            <p className="text-xs text-emerald-500 mt-0.5">Alle afspraken zijn geweest</p>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Search & Filter Bar ─────────────────────────────────────
function SearchFilterBar({
  searchQuery,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  isExpanded,
  onToggleExpand,
  allCategories,
  customCategories,
  onManageCategories,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategories: Set<AgendaCategory>;
  onToggleCategory: (cat: AgendaCategory) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  allCategories: string[];
  customCategories?: CustomCategory[];
  onManageCategories?: () => void;
}) {
  const hasActiveFilters = searchQuery.length > 0 || activeCategories.size < allCategories.length;

  return (
    <div className="mb-3">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleExpand}
          className={`p-2 rounded-xl transition-all duration-200 ${
            isExpanded || hasActiveFilters
              ? "bg-emerald-100 text-emerald-600 shadow-sm"
              : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200"
          }`}
          aria-label="Zoeken en filteren"
          aria-pressed={isExpanded}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {isExpanded && (
          <div className="flex-1 animate-fadeIn">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Zoek afspraken..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
              aria-label="Zoek afspraken"
            />
          </div>
        )}

        {isExpanded && searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
            aria-label="Wis zoekopdracht"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category filter chips */}
      {isExpanded && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 animate-fadeIn items-center">
          {allCategories.map((cat) => {
            const config = getCategoryConfig(cat, customCategories);
            const isActive = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleCategory(cat)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
                  isActive
                    ? `${config.bgColor} ${config.color} ring-1 ${config.borderColor.replace("border", "ring")}`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 line-through"
                }`}
              >
                <span className="text-xs">{config.emoji}</span>
                {config.label}
              </button>
            );
          })}
          {onManageCategories && (
            <button
              onClick={onManageCategories}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Categorieën beheren"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Beheer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline View ──────────────────────────────────────────
function TimelineView({
  events,
  onEdit,
  onDelete,
  selectedDate,
  onReorderAllDay,
}: {
  events: AgendaEvent[];
  onEdit: (event: AgendaEvent) => void;
  onDelete: (id: string) => void;
  selectedDate: string;
  onReorderAllDay?: (eventId: string, direction: "up" | "down") => void;
}) {
  const allDayEvents = useMemo(() => events.filter((e) => e.allDay), [events]);
  const timedEvents = useMemo(() => events.filter((e) => !e.allDay), [events]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Detect conflicts among all events for this day
  const conflictIds = useMemo(() => getConflictingEventIds(events), [events]);

  // Current time indicator - update every minute for accuracy
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isToday = selectedDate === getToday();

  // Auto-scroll to current time on mount and when switching to today
  useEffect(() => {
    if (isToday && currentTimeRef.current) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        currentTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isToday, selectedDate]);

  // Hours to display (6 AM to 11 PM, or expand based on events)
  const hours = useMemo(() => {
    let min = 6;
    let max = 23;
    for (const e of timedEvents) {
      if (e.startTime) {
        const h = parseInt(e.startTime.split(":")[0]);
        if (h < min) min = h;
      }
      if (e.endTime) {
        const h = parseInt(e.endTime.split(":")[0]);
        if (h > max) max = Math.min(h + 1, 24);
      }
    }
    return Array.from({ length: max - min }, (_, i) => min + i);
  }, [timedEvents]);

  // Pre-compute stagger animation index for each event
  const allDayCount = allDayEvents.length;

  // Pre-compute events grouped by hour for O(1) lookup instead of filtering per hour
  const eventsByHour = useMemo(() => {
    const map = new Map<number, AgendaEvent[]>();
    for (const e of timedEvents) {
      if (!e.startTime) continue;
      const h = parseInt(e.startTime.split(":")[0]);
      const existing = map.get(h) || [];
      existing.push(e);
      map.set(h, existing);
    }
    return map;
  }, [timedEvents]);

  // State for showing all all-day events when there are many
  const [showAllAllDay, setShowAllAllDay] = useState(false);
  const MAX_VISIBLE_ALL_DAY = 5;
  const visibleAllDayEvents = showAllAllDay ? allDayEvents : allDayEvents.slice(0, MAX_VISIBLE_ALL_DAY);
  const hasMoreAllDay = allDayEvents.length > MAX_VISIBLE_ALL_DAY;

  return (
    <div ref={timelineRef}>
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
            Hele dag
          </p>
          <div className="space-y-2">
            {visibleAllDayEvents.map((event, idx) => (
              <div key={event.id} className="flex items-start gap-1">
                {onReorderAllDay && allDayEvents.length > 1 && (
                  <div className="flex flex-col gap-0.5 pt-3 flex-shrink-0">
                    <button
                      onClick={() => onReorderAllDay(event.id, "up")}
                      disabled={idx === 0}
                      className={`p-0.5 rounded transition-colors ${idx === 0 ? "text-gray-200 dark:text-gray-700" : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200"}`}
                      aria-label="Omhoog verplaatsen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onReorderAllDay(event.id, "down")}
                      disabled={idx === allDayEvents.length - 1}
                      className={`p-0.5 rounded transition-colors ${idx === allDayEvents.length - 1 ? "text-gray-200 dark:text-gray-700" : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200"}`}
                      aria-label="Omlaag verplaatsen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <EventCard event={event} onEdit={onEdit} onDelete={onDelete} index={idx} />
                </div>
              </div>
            ))}
            {hasMoreAllDay && (
              <button
                onClick={() => setShowAllAllDay(!showAllAllDay)}
                className="w-full py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                {showAllAllDay
                  ? "Minder tonen"
                  : `Nog ${allDayEvents.length - MAX_VISIBLE_ALL_DAY} meer tonen`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conflict summary banner */}
      {conflictIds.size > 0 && (
        <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs text-amber-700 font-medium">
            {conflictIds.size} {conflictIds.size === 1 ? "afspraak overlapt" : "afspraken overlappen"} in tijd
          </p>
        </div>
      )}

      {/* Timeline */}
      {timedEvents.length > 0 ? (
        <div className="relative">
          {hours.map((hour) => {
            const hourEvents = eventsByHour.get(hour) || [];

            const isCurrentHour = isToday && currentHour === hour;
            const isPastHour = isToday && hour < currentHour;

            return (
              <div key={hour} className="flex min-h-[3.5rem]">
                <div className={`w-14 flex-shrink-0 text-right pr-3 pt-0 text-xs font-medium transition-colors ${
                  isCurrentHour ? "text-emerald-600 font-semibold" : isPastHour ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"
                }`}>
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className={`flex-1 border-t pt-1 pb-2 relative transition-colors ${
                  isPastHour ? "border-gray-50 dark:border-gray-800" : "border-gray-100 dark:border-gray-700"
                }`}>
                  {/* Current time line - more prominent */}
                  {isCurrentHour && (
                    <div
                      ref={currentTimeRef}
                      className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                      style={{ top: `${(currentMinute / 60) * 100}%` }}
                      aria-hidden="true"
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-md shadow-red-200 animate-timePulse" />
                      <div className="flex-1 h-0.5 bg-red-500 shadow-sm shadow-red-200" />
                      <span className="ml-1 text-[10px] font-bold text-red-500 bg-white dark:bg-gray-800 px-1 rounded">
                        {String(currentHour).padStart(2, "0")}:{String(currentMinute).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {hourEvents.map((event, evIdx) => (
                      <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} index={allDayCount + evIdx} hasConflict={conflictIds.has(event.id)} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        allDayEvents.length === 0 && <EmptyStateIllustration />
      )}
    </div>
  );
}

// ─── Add/Edit Modal ─────────────────────────────────────────
function EventModal({
  event,
  selectedDate,
  defaultCategory,
  onSave,
  onClose,
  allCategories,
  customCategories,
}: {
  event: AgendaEvent | null;
  selectedDate: string;
  defaultCategory?: AgendaCategory | null;
  onSave: (data: {
    title: string;
    description: string;
    category: AgendaCategory;
    date: string;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    recurrence: RecurrenceType;
    assignedTo: string | null;
    birthdayGroup: string | null;
    birthYear: number | null;
    reminder: ReminderOption | null;
    recurrenceInterval: number;
  }) => Promise<void>;
  onClose: () => void;
  allCategories: string[];
  customCategories?: CustomCategory[];
}) {
  const smartStart = getSmartDefaultStartTime();
  const smartEnd = getSmartDefaultEndTime(smartStart);
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [category, setCategory] = useState<AgendaCategory>(event?.category || defaultCategory || "afspraak");
  const [date, setDate] = useState(event?.date || selectedDate);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStartTime] = useState(event?.startTime || smartStart);
  const [endTime, setEndTime] = useState(event?.endTime || smartEnd);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(event?.recurrence || "none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(event?.recurrenceInterval ?? 1);
  const [assignedTo, setAssignedTo] = useState(event?.assignedTo || "");
  const [birthdayGroup, setBirthdayGroup] = useState(event?.birthdayGroup || "");
  const [birthYear, setBirthYear] = useState(event?.birthYear?.toString() || "");
  const [reminder, setReminder] = useState<ReminderOption | "">(event?.reminder || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Default recurrence to "yearly" when category changes to "verjaardag"
  // Clear birthday fields when switching away from verjaardag
  useEffect(() => {
    if (category === "verjaardag" && !event) {
      setRecurrence("yearly");
    }
    if (category !== "verjaardag") {
      setBirthdayGroup("");
      setBirthYear("");
    }
  }, [category, event]);

  // Close on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        allDay,
        recurrence,
        assignedTo: assignedTo.trim() || null,
        birthdayGroup: category === "verjaardag" && birthdayGroup.trim() ? birthdayGroup.trim() : null,
        birthYear: category === "verjaardag" && birthYear ? (Number.isNaN(parseInt(birthYear, 10)) ? null : parseInt(birthYear, 10)) : null,
        reminder: reminder || null,
        recurrenceInterval: recurrence !== "none" ? recurrenceInterval : 1,
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-900 transition-colors py-1 px-2 -ml-2 rounded-lg"
            aria-label="Annuleren"
          >
            Annuleren
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100" id="modal-title">
            {event ? "Afspraak bewerken" : "Nieuwe afspraak"}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !title.trim()}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition-all py-1 px-2 -mr-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            aria-label={isSaving ? "Opslaan..." : "Bewaar afspraak"}
          >
            {isSaving ? "..." : "Bewaar"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel toevoegen"
              className="w-full text-lg font-medium text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 border-0 border-b-2 border-gray-100 dark:border-gray-700 bg-transparent focus:border-emerald-500 focus:ring-0 pb-2 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Category chips */}
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Categorie
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const config = getCategoryConfig(cat, customCategories);
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${isActive
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${config.borderColor.replace("border", "ring")}`
                        : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    <span>{config.emoji}</span>
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="event-date" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Datum
            </label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="all-day-toggle" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">Hele dag</label>
            <button
              id="all-day-toggle"
              type="button"
              onClick={() => setAllDay(!allDay)}
              className={`relative w-11 h-6 rounded-full transition-colors ${allDay ? "bg-emerald-600" : "bg-gray-200 dark:bg-gray-600"}`}
              role="switch"
              aria-checked={allDay}
              aria-label="Hele dag"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allDay ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Time pickers */}
          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="start-time" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Van
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="end-time" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Tot
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Recurrence */}
          <div>
            <label htmlFor="recurrence" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Herhaling
            </label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
            >
              {(Object.entries(RECURRENCE_LABELS) as [RecurrenceType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Recurrence interval */}
          {recurrence !== "none" && (
            <div>
              <label htmlFor="event-interval" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Elke
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="event-interval"
                  type="number"
                  min={1}
                  max={52}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {recurrence === "daily" ? (recurrenceInterval === 1 ? "dag" : "dagen")
                    : recurrence === "weekly" ? (recurrenceInterval === 1 ? "week" : "weken")
                    : recurrence === "monthly" ? (recurrenceInterval === 1 ? "maand" : "maanden")
                    : (recurrenceInterval === 1 ? "jaar" : "jaar")}
                </span>
              </div>
            </div>
          )}

          {/* Reminder / Alarm */}
          <div>
            <label htmlFor="event-reminder" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Herinnering
            </label>
            <select
              id="event-reminder"
              value={reminder}
              onChange={(e) => setReminder(e.target.value as ReminderOption | "")}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
            >
              <option value="">Geen</option>
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned to */}
          <div>
            <label htmlFor="assigned-to" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Toegewezen aan (optioneel)
            </label>
            <input
              id="assigned-to"
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Naam familielid"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Birthday-specific fields */}
          {category === "verjaardag" && (
            <>
              <div>
                <label htmlFor="birthday-group" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Groep
                </label>
                <select
                  id="birthday-group"
                  value={birthdayGroup}
                  onChange={(e) => setBirthdayGroup(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                >
                  <option value="">Geen groep</option>
                  {DEFAULT_BIRTHDAY_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="birth-year" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Geboortejaar
                </label>
                <input
                  id="birth-year"
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="bijv. 1990"
                  min={1900}
                  max={2100}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label htmlFor="event-desc" className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Notities
            </label>
            <textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Voeg extra details toe..."
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600" role="alert">{saveError}</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Week Strip (horizontal day selector) ───────────────────
const WeekStrip = memo(function WeekStrip({
  selectedDate,
  onSelectDate,
  eventDates,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  eventDates: Map<string, AgendaCategory[]>;
}) {
  const today = getToday();

  const weekDays = useMemo(() => {
    const selected = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = selected.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(selected);
    monday.setDate(selected.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        dayName: DAYS_NL[i],
        dayFullName: DAYS_FULL_NL[i],
        dayNum: d.getDate(),
        monthName: MONTHS_NL[d.getMonth()],
      };
    });
  }, [selectedDate]);

  return (
    <div className="flex gap-1 sm:gap-1.5 py-3 bg-white dark:bg-gray-800 rounded-2xl px-1" role="tablist" aria-label="Weekdagen">
      {weekDays.map(({ date, dayName, dayFullName, dayNum, monthName }) => {
        const isToday = date === today;
        const isSelected = date === selectedDate;
        const categories = eventDates.get(date) || [];

        return (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={`
              flex-1 flex flex-col items-center py-2 sm:py-2.5 rounded-2xl transition-all duration-200 min-w-0
              ${isSelected ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" : ""}
              ${isToday && !isSelected ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-700" : ""}
              ${!isSelected ? "hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100" : ""}
            `}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${dayFullName} ${dayNum} ${monthName}${categories.length > 0 ? `, ${categories.length} afspraken` : ""}`}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-emerald-100" : "text-gray-400 dark:text-gray-500"}`}>
              {dayName}
            </span>
            <span className={`text-base sm:text-lg font-bold mt-0.5 ${isSelected ? "text-white" : isToday ? "text-emerald-600" : "text-gray-700 dark:text-gray-300"}`}>
              {dayNum}
            </span>
            {categories.length > 0 && (
              <div className="flex gap-0.5 mt-1">
                {categories.slice(0, 3).map((cat, i) => (
                  <span
                    key={i}
                    className={`block w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : getCategoryDotColor(cat)}`}
                  />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

// ─── Week Overview ──────────────────────────────────────────
function WeekOverview({
  selectedDate,
  onSelectDate,
  onNavigateWeek,
  getEventsForDate,
  getTasksForDate,
  onEdit,
  onDelete,
  onTaskStatusChange,
  onTaskEdit,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onNavigateWeek: (date: string) => void;
  getEventsForDate: (date: string) => AgendaEvent[];
  getTasksForDate?: (date: string) => KlusjesItem[];
  onEdit: (event: AgendaEvent) => void;
  onDelete: (id: string) => void;
  onTaskStatusChange?: (id: string, status: KlusjesStatus, completionDate?: string) => Promise<void>;
  onTaskEdit?: (item: KlusjesItem) => void;
}) {
  const today = getToday();
  const selected = new Date(selectedDate + "T00:00:00");

  // Get Monday of the week
  const dayOfWeek = selected.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() + mondayOffset);

  // Track which days are expanded (today is open by default)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    initial.add(today);
    initial.add(selectedDate);
    return initial;
  });

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      date: dateStr,
      dayName: DAYS_FULL_NL[i],
      dayNum: d.getDate(),
      monthName: MONTHS_NL[d.getMonth()],
    };
  });

  // Navigate week (stays in week view)
  const goToPrevWeek = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 7);
    const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onNavigateWeek(prev);
  };

  const goToNextWeek = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 7);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onNavigateWeek(next);
  };

  return (
    <div className="mt-4 mb-6">
      {/* Week navigation header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrevWeek}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
          aria-label="Vorige week"
        >
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Week van {weekDays[0].dayNum} {weekDays[0].monthName.slice(0, 3)} - {weekDays[6].dayNum} {weekDays[6].monthName.slice(0, 3)}
        </h3>
        <button
          onClick={goToNextWeek}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
          aria-label="Volgende week"
        >
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days list */}
      <div className="space-y-2">
        {weekDays.map(({ date, dayName, dayNum, monthName }, i) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date === today;
          const isPast = date < today;
          const isExpanded = expandedDays.has(date);
          const conflictIds = getConflictingEventIds(dayEvents);

          return (
            <div
              key={date}
              className={`rounded-xl border transition-all duration-200 animate-fadeInUp ${
                isToday
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200/50 dark:ring-emerald-700/50"
                  : isPast
                    ? "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50"
                    : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              {/* Day row - clickable to expand/collapse */}
              <button
                onClick={() => toggleDay(date)}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                aria-expanded={isExpanded}
                aria-label={`${dayName} ${dayNum} ${monthName}, ${dayEvents.length} ${dayEvents.length === 1 ? "afspraak" : "afspraken"}`}
              >
                {/* Day number circle */}
                <div className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold ${
                  isToday
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                    : isPast
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {dayNum}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold capitalize ${
                      isToday ? "text-emerald-700" : isPast ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {dayName}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
                        Vandaag
                      </span>
                    )}
                  </div>
                  {/* Compact event summary when collapsed */}
                  {!isExpanded && dayEvents.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex -space-x-0.5">
                        {dayEvents.slice(0, 4).map((ev, j) => (
                          <span
                            key={j}
                            className={`block w-2 h-2 rounded-full border border-white ${getCategoryDotColor(ev.category)}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {dayEvents.length} {dayEvents.length === 1 ? "afspraak" : "afspraken"}
                      </span>
                    </div>
                  )}
                  {!isExpanded && dayEvents.length === 0 && (
                    <span className="text-xs text-gray-300 dark:text-gray-600 mt-0.5 block">Geen afspraken</span>
                  )}
                </div>

                {/* Event count badge + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {dayEvents.length > 0 && (
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      isToday
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {dayEvents.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded events list */}
              {isExpanded && (
                <div className="px-3.5 pb-3 animate-expandDown">
                  {dayEvents.length > 0 ? (
                    <div className="space-y-1.5 ml-12">
                      {dayEvents.map((event, j) => (
                        <div key={event.id} className="flex items-stretch gap-0">
                          {/* Category color line for week view quick scanning */}
                          <div className={`w-1 rounded-full flex-shrink-0 ${getCategoryLineColor(event.category)}`} />
                          <div className="flex-1 min-w-0 ml-1.5">
                            <EventCard
                              event={event}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              index={j}
                              hasConflict={conflictIds.has(event.id)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 dark:text-gray-600 ml-12 py-1">Vrije dag!</p>
                  )}
                  {/* Tasks for this day */}
                  {getTasksForDate && onTaskStatusChange && (() => {
                    const dayTasks = getTasksForDate(date);
                    if (dayTasks.length === 0) return null;
                    return (
                      <div className="ml-12 mt-2">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Taken</p>
                        <div className="space-y-1">
                          {dayTasks.map((task) => (
                            <TaskCard key={task.id} item={task} onStatusChange={onTaskStatusChange} onEdit={onTaskEdit} />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Quick "go to this day" link */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectDate(date); }}
                    className="ml-12 mt-2 text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors flex items-center gap-1"
                    aria-label={`Bekijk ${dayName} ${dayNum} ${monthName} in dagweergave`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Bekijk dag
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upcoming Events ────────────────────────────────────────
const UpcomingEvents = memo(function UpcomingEvents({
  events,
  selectedDate,
  onSelectDate,
  customCategories,
}: {
  events: AgendaEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  customCategories?: CustomCategory[];
}) {
  // Get next 5 upcoming events from today
  const today = getToday();
  const upcoming = useMemo(() =>
    events
      .filter((e) => e.date >= today && e.date !== selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""))
      .slice(0, 5),
    [events, today, selectedDate]
  );

  if (upcoming.length === 0) return null;

  return (
    <div className="mt-8 mb-20">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        Binnenkort
      </h3>
      <div className="space-y-1.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {upcoming.map((event, i) => {
          const config = getCategoryConfig(event.category, customCategories);
          const d = new Date(event.date + "T00:00:00");
          const dateLabel = d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });

          return (
            <button
              key={event.id}
              onClick={() => onSelectDate(event.date)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors text-left ${
                i > 0 ? "border-t border-gray-100 dark:border-gray-700" : ""
              }`}
              aria-label={`${event.title}, ${dateLabel}${!event.allDay && event.startTime ? ` om ${event.startTime}` : ""}`}
            >
              <span className={`w-9 h-9 flex items-center justify-center rounded-xl ${config.bgColor} text-base shadow-sm`}>
                {config.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {dateLabel}
                  {!event.allDay && event.startTime && ` om ${event.startTime}`}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ─── Quick Add FAB ──────────────────────────────────────────
type QuickAddItem = { category: AgendaCategory; label: string; type: "event" } | { label: string; type: "task" };

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { label: "Taak", type: "task" },
  { category: "afspraak", label: "Afspraak", type: "event" },
  { category: "familie", label: "Familie", type: "event" },
  { category: "werk", label: "Werk", type: "event" },
  { category: "school", label: "School", type: "event" },
  { category: "sport", label: "Sport", type: "event" },
  { category: "verjaardag", label: "Verjaardag", type: "event" },
];

function QuickAddFAB({
  onQuickAdd,
  onGenericAdd,
  onAddTask,
  customCategories,
  hiddenBuiltIn,
}: {
  onQuickAdd: (category: AgendaCategory) => void;
  onGenericAdd: () => void;
  onAddTask: () => void;
  customCategories?: CustomCategory[];
  hiddenBuiltIn?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleItems = useMemo(() => {
    const hidden = hiddenBuiltIn ?? [];
    const items: QuickAddItem[] = QUICK_ADD_ITEMS.filter((item) => {
      if (item.type === "task") return true;
      return !hidden.includes(item.category);
    });
    // Add custom categories that aren't already in the list
    const existingCats = new Set(items.filter((i): i is QuickAddItem & { type: "event" } => i.type === "event").map((i) => i.category));
    for (const c of customCategories ?? []) {
      if (!existingCats.has(c.label)) {
        items.push({ category: c.label, label: c.label, type: "event" });
      }
    }
    return items;
  }, [hiddenBuiltIn, customCategories]);

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end">
      {/* Quick-add category buttons */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2">
          {visibleItems.map((item, i) => {
            if (item.type === "task") {
              return (
                <button
                  key="task"
                  onClick={() => {
                    onAddTask();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 animate-scaleIn"
                  style={{ animationDelay: `${(visibleItems.length - 1 - i) * 40}ms`, animationFillMode: "both" }}
                  aria-label="Nieuwe taak toevoegen"
                >
                  <span className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {item.label}
                  </span>
                  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 shadow-md text-base">
                    &#9745;
                  </span>
                </button>
              );
            }
            const config = getCategoryConfig(item.category, customCategories);
            return (
              <button
                key={item.category}
                onClick={() => {
                  onQuickAdd(item.category);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 animate-scaleIn"
                style={{ animationDelay: `${(visibleItems.length - 1 - i) * 40}ms`, animationFillMode: "both" }}
                aria-label={`Nieuwe ${item.label.toLowerCase()} toevoegen`}
              >
                <span className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {item.label}
                </span>
                <span className={`w-10 h-10 flex items-center justify-center rounded-full ${config.bgColor} shadow-md text-base`}>
                  {config.emoji}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            setIsOpen(true);
          }
        }}
        onDoubleClick={() => {
          setIsOpen(false);
          onGenericAdd();
        }}
        className={`w-14 h-14 rounded-full shadow-lg shadow-emerald-300/40 hover:shadow-xl hover:shadow-emerald-300/50 active:scale-95 transition-all flex items-center justify-center ${
          isOpen ? "bg-gray-700 rotate-45" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
        style={{ transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
        aria-label={isOpen ? "Menu sluiten" : "Nieuwe afspraak toevoegen"}
        aria-expanded={isOpen}
      >
        <svg className="w-7 h-7 text-white transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Backdrop when FAB menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1] bg-black/10 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Swipe Hook ─────────────────────────────────────────────
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    const elapsed = Date.now() - touchStart.current.time;

    // Minimum swipe distance of 60px, max time 500ms, and more horizontal than vertical
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && elapsed < 500) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { handleTouchStart, handleTouchEnd };
}

// ─── Main Page ──────────────────────────────────────────────
export default function AgendaPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { events, isLoading, error, addEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForMonth } = useAgenda(user?.familyId);
  const { items: tasks, isLoading: tasksLoading, addItem: addTask, updateItem: updateTask, updateStatus: updateTaskStatus, getItemsForDate: getTasksForDate } = useKlusjes(user?.familyId);
  const { categories: customCategories, hiddenBuiltIn, addCategory, deleteCategory, toggleBuiltIn } = useCustomCategories(user?.familyId);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const allCategories = useMemo(() => {
    const labels: string[] = ALL_BUILT_IN_CATEGORIES.filter((c) => !hiddenBuiltIn.includes(c));
    for (const c of customCategories) {
      if (!labels.includes(c.label)) labels.push(c.label);
    }
    return labels;
  }, [customCategories, hiddenBuiltIn]);
  const allCategoriesCount = allCategories.length;

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<KlusjesItem | null>(null);
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [quickAddCategory, setQuickAddCategory] = useState<AgendaCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dag");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<AgendaCategory>>(
    () => new Set(allCategories)
  );
  const [allDayOrder, setAllDayOrder] = useState<Map<string, string[]>>(new Map());

  // Sync activeCategories when allCategories changes (e.g. after hiddenBuiltIn loads)
  const prevAllCategoriesRef = useRef(allCategories);
  useEffect(() => {
    const prev = prevAllCategoriesRef.current;
    if (prev !== allCategories) {
      prevAllCategoriesRef.current = allCategories;
      setActiveCategories((current) => {
        const next = new Set<AgendaCategory>();
        for (const cat of allCategories) {
          // Keep existing filter state for categories that were already there
          if (prev.includes(cat)) {
            if (current.has(cat)) next.add(cat);
          } else {
            // New category: include by default
            next.add(cat);
          }
        }
        // Ensure at least one category is active
        if (next.size === 0 && allCategories.length > 0) {
          next.add(allCategories[0]);
        }
        return next;
      });
    }
  }, [allCategories]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Toggle category filter
  const handleToggleCategory = useCallback((cat: AgendaCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  // Check if search/filter is active
  const isFiltering = searchQuery.length > 0 || activeCategories.size < allCategoriesCount;

  // Filter helper
  const applyFilters = useCallback((evts: AgendaEvent[]): AgendaEvent[] => {
    let filtered = evts;
    if (activeCategories.size < allCategoriesCount) {
      filtered = filtered.filter((e) => activeCategories.has(e.category));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (e) => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [searchQuery, activeCategories]);

  // Build event dates map for calendar dots
  const eventDates = useMemo(() => {
    const map = new Map<string, AgendaCategory[]>();
    const monthEvents = getEventsForMonth(viewYear, viewMonth);
    for (const event of monthEvents) {
      const existing = map.get(event.date) || [];
      if (!existing.includes(event.category)) {
        existing.push(event.category);
      }
      map.set(event.date, existing);
    }
    return map;
  }, [viewYear, viewMonth, getEventsForMonth]);

  const dayEvents = useMemo(() => {
    const raw = getEventsForDate(selectedDate);
    const filtered = applyFilters(raw);

    // Apply all-day ordering if set
    const orderForDate = allDayOrder.get(selectedDate);
    if (orderForDate) {
      const allDay = filtered.filter((e) => e.allDay);
      const timed = filtered.filter((e) => !e.allDay);
      const orderedAllDay = orderForDate
        .map((id) => allDay.find((e) => e.id === id))
        .filter(Boolean) as AgendaEvent[];
      // Include any all-day events not in the order list (newly added)
      const remaining = allDay.filter((e) => !orderForDate.includes(e.id));
      return [...orderedAllDay, ...remaining, ...timed];
    }
    return filtered;
  }, [selectedDate, getEventsForDate, applyFilters, allDayOrder]);

  // Filtered getEventsForDate for week view
  const getFilteredEventsForDate = useCallback(
    (date: string) => applyFilters(getEventsForDate(date)),
    [getEventsForDate, applyFilters]
  );

  // Reorder all-day events handler
  const handleReorderAllDay = useCallback((eventId: string, direction: "up" | "down") => {
    const allDay = dayEvents.filter((e) => e.allDay);
    const ids = allDay.map((e) => e.id);
    const idx = ids.indexOf(eventId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= ids.length) return;
    // Swap
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    setAllDayOrder((prev) => {
      const next = new Map(prev);
      next.set(selectedDate, ids);
      return next;
    });
  }, [dayEvents, selectedDate]);

  // Navigate to next/prev day with animation direction
  const goToNextDay = useCallback(() => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSlideDirection("left");
    setSelectedDate(next);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }, [selectedDate]);

  const goToPrevDay = useCallback(() => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSlideDirection("right");
    setSelectedDate(prev);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }, [selectedDate]);

  // Clear slide direction after animation completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // Swipe gesture support
  const { handleTouchStart, handleTouchEnd } = useSwipeGesture(goToNextDay, goToPrevDay);

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  // Handle user with no family
  if (!user.familyId) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Geen familie gevonden</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Je bent nog niet gekoppeld aan een familie. Vraag een uitnodiging aan of maak een familie aan.</p>
        <button
          onClick={() => router.push("/instellingen")}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
        >
          Ga naar instellingen
        </button>
      </main>
    );
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    // Determine slide direction based on date comparison
    if (date > selectedDate) {
      setSlideDirection("left");
    } else if (date < selectedDate) {
      setSlideDirection("right");
    }
    setSelectedDate(date);
    // Sync calendar month when selecting a date
    const d = new Date(date + "T00:00:00");
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const handleSave = async (data: {
    title: string;
    description: string;
    category: AgendaCategory;
    date: string;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    recurrence: RecurrenceType;
    assignedTo: string | null;
    birthdayGroup: string | null;
    birthYear: number | null;
    reminder: ReminderOption | null;
    recurrenceInterval: number;
  }) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await addEvent(data);
    }
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingEvent(event);
    setQuickAddCategory(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setQuickAddCategory(null);
    setShowModal(true);
  };

  const openNewEventWithCategory = (category: AgendaCategory) => {
    setEditingEvent(null);
    setQuickAddCategory(category);
    setShowModal(true);
  };

  // Animation class for the day content area
  const slideAnimClass = slideDirection === "left"
    ? "animate-slideInRight"
    : slideDirection === "right"
      ? "animate-slideInLeft"
      : "";

  return (
    <main id="main-content" className="max-w-md md:max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {events.length} {events.length === 1 ? "afspraak" : "afspraken"} totaal
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Dag / Week toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5" role="tablist" aria-label="Weergave">
            <button
              onClick={() => setViewMode("dag")}
              role="tab"
              aria-selected={viewMode === "dag"}
              aria-label="Dagweergave"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                viewMode === "dag"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Dag
            </button>
            <button
              onClick={() => setViewMode("week")}
              role="tab"
              aria-selected={viewMode === "week"}
              aria-label="Weekweergave"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                viewMode === "week"
                  ? "bg-white dark:bg-gray-800 text-emerald-700 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Week
            </button>
          </div>

          {/* Today quick jump */}
          {selectedDate !== getToday() && (
            <button
              onClick={() => handleSelectDate(getToday())}
              className="px-3 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl transition-colors"
            >
              Vandaag
            </button>
          )}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`p-2 rounded-xl transition-all duration-200 ${showCalendar ? "bg-emerald-100 text-emerald-600 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200"}`}
            aria-label="Toon kalender"
            aria-pressed={showCalendar}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar (collapsible) */}
      {showCalendar && (
        <div className="mb-4">
          <MiniCalendar
            year={viewYear}
            month={viewMonth}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToToday={() => handleSelectDate(getToday())}
            eventDates={eventDates}
          />
        </div>
      )}

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
        isExpanded={searchExpanded}
        onToggleExpand={() => setSearchExpanded(!searchExpanded)}
        allCategories={allCategories}
        customCategories={customCategories}
        onManageCategories={() => setShowCategoryManager(true)}
      />

      {/* Week strip */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        eventDates={eventDates}
      />

      {/* Error */}
      <div aria-live="polite">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700 rounded-xl animate-fadeIn">
            <p className="text-red-600 text-sm" role="alert">{error}</p>
          </div>
        )}
      </div>

      {/* Active filter indicator */}
      {isFiltering && (
        <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 animate-fadeIn">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium">Filter actief</span>
          <button
            onClick={() => { setSearchQuery(""); setActiveCategories(new Set(allCategories)); }}
            className="ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Wis alle filters"
          >
            Wis filters
          </button>
        </div>
      )}

      {viewMode === "dag" ? (
        <>
          {/* Swipeable day content area */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="min-h-[40vh]"
          >
            {/* Day header */}
            <div key={`header-${selectedDate}`} className={slideAnimClass}>
              <DayHeader date={selectedDate} eventCount={dayEvents.length} onPrevDay={goToPrevDay} onNextDay={goToNextDay} />
            </div>

            {/* Today summary widget */}
            {selectedDate === getToday() && dayEvents.length > 0 && (
              <TodaySummary events={dayEvents} />
            )}

            {/* Day events / Timeline */}
            <div key={`timeline-${selectedDate}`} className={slideAnimClass}>
              <TimelineView events={dayEvents} onEdit={handleEdit} onDelete={handleDelete} selectedDate={selectedDate} onReorderAllDay={handleReorderAllDay} />
            </div>
          </div>

          {/* Tasks for selected day */}
          {(() => {
            const dayTasks = getTasksForDate(selectedDate);
            if (dayTasks.length === 0) return null;
            return (
              <div className="mt-6 mb-4">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span>&#9745;</span>
                  Taken ({dayTasks.length})
                </h3>
                <div className="space-y-1.5">
                  {dayTasks.map((task) => (
                    <TaskCard key={task.id} item={task} onStatusChange={updateTaskStatus} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Upcoming events */}
          <UpcomingEvents events={events} selectedDate={selectedDate} onSelectDate={handleSelectDate} customCategories={customCategories} />
        </>
      ) : (
        /* Week overview */
        <WeekOverview
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            handleSelectDate(date);
            setViewMode("dag");
          }}
          onNavigateWeek={handleSelectDate}
          getEventsForDate={getFilteredEventsForDate}
          getTasksForDate={getTasksForDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTaskStatusChange={updateTaskStatus}
          onTaskEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
        />
      )}

      {/* Quick Add FAB */}
      <QuickAddFAB
        onQuickAdd={openNewEventWithCategory}
        onGenericAdd={openNewEvent}
        onAddTask={() => { setEditingTask(null); setShowTaskModal(true); }}
        customCategories={customCategories}
        hiddenBuiltIn={hiddenBuiltIn}
      />

      {/* Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          defaultCategory={quickAddCategory}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
            setQuickAddCategory(null);
          }}
          allCategories={allCategories}
          customCategories={customCategories}
        />
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <AddTaskModal
          selectedDate={selectedDate}
          task={editingTask}
          onSave={async (data) => {
            if (editingTask) {
              const realId = editingTask.id.includes("_") ? editingTask.id.split("_")[0] : editingTask.id;
              await updateTask(realId, data);
            } else {
              await addTask(data);
            }
          }}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowCategoryManager(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Categorieën beheren"
        >
          <div
            className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Categorieën beheren</h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-1 px-2 -mr-2 rounded-lg"
                aria-label="Sluiten"
              >
                Sluiten
              </button>
            </div>
            <div className="p-5">
              <CategoryManager
                categories={customCategories}
                onAdd={addCategory}
                onDelete={deleteCategory}
                hiddenBuiltIn={hiddenBuiltIn}
                onToggleBuiltIn={toggleBuiltIn}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
