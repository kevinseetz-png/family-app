export type AgendaCategory =
  | "familie"
  | "werk"
  | "school"
  | "gezondheid"
  | "sport"
  | "verjaardag"
  | "afspraak"
  | "overig";

export const CATEGORY_CONFIG: Record<
  AgendaCategory,
  { label: string; color: string; bgColor: string; borderColor: string; emoji: string }
> = {
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
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}
