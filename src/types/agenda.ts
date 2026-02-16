import type { CustomCategory } from "./customCategory";
import { COLOR_SCHEMES } from "./customCategory";
import type { ReminderOption } from "./klusjes";

export type BuiltInCategory =
  | "familie"
  | "werk"
  | "school"
  | "gezondheid"
  | "sport"
  | "verjaardag"
  | "afspraak"
  | "overig";

// AgendaCategory is a string to support custom categories
export type AgendaCategory = string;

export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
  "familie", "werk", "school", "gezondheid", "sport", "verjaardag", "afspraak", "overig",
];

export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const CATEGORY_CONFIG: Record<BuiltInCategory, CategoryConfig> = {
  familie: {
    label: "Familie",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-400",
    emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
  },
  werk: {
    label: "Werk",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-400",
    emoji: "\uD83D\uDCBC",
  },
  school: {
    label: "School",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
    emoji: "\uD83C\uDF93",
  },
  gezondheid: {
    label: "Gezondheid",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-400",
    emoji: "\u2764\uFE0F",
  },
  sport: {
    label: "Sport",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
    emoji: "\u26BD",
  },
  verjaardag: {
    label: "Verjaardag",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-400",
    emoji: "\uD83C\uDF82",
  },
  afspraak: {
    label: "Afspraak",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-400",
    emoji: "\uD83D\uDCC5",
  },
  overig: {
    label: "Overig",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-400",
    emoji: "\uD83D\uDCCC",
  },
};

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const DEFAULT_BIRTHDAY_GROUPS = ["Familie", "Vrienden", "Collega", "Buren", "Overig"] as const;

export interface AgendaEvent {
  id: string;
  familyId: string;
  title: string;
  description: string;
  category: AgendaCategory;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM or null for all-day
  endTime: string | null; // HH:MM or null for all-day
  allDay: boolean;
  recurrence: RecurrenceType;
  assignedTo: string | null; // user name or null for everyone
  birthdayGroup: string | null; // group label for verjaardag events
  birthYear: number | null; // birth year for verjaardag events (age calculation)
  reminder: ReminderOption | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}

const DEFAULT_CONFIG: CategoryConfig = {
  label: "Overig",
  color: "text-gray-700",
  bgColor: "bg-gray-50",
  borderColor: "border-gray-400",
  emoji: "\uD83D\uDCCC",
};

export function getCategoryConfig(
  category: string,
  customCategories?: CustomCategory[]
): CategoryConfig {
  // Check built-in first
  if (category in CATEGORY_CONFIG) {
    return CATEGORY_CONFIG[category as BuiltInCategory];
  }

  // Check custom categories
  if (customCategories) {
    const custom = customCategories.find((c) => c.label === category);
    if (custom) {
      const scheme = COLOR_SCHEMES[custom.colorScheme] ?? COLOR_SCHEMES.grijs;
      return {
        label: custom.label,
        emoji: custom.emoji,
        ...scheme,
      };
    }
  }

  return DEFAULT_CONFIG;
}
