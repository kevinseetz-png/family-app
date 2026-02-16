export type KlusjesStatus = "todo" | "bezig" | "klaar";
export type KlusjesRecurrence = "none" | "daily" | "weekly" | "monthly";
export type KlusjesPriority = 1 | 2 | 3;
export type ReminderOption = "0" | "5" | "15" | "30" | "60" | "1440";

export interface KlusjesItem {
  id: string;
  familyId: string;
  name: string;
  status: KlusjesStatus;
  priority: KlusjesPriority;
  date: string | null;
  endDate: string | null;
  recurrence: KlusjesRecurrence;
  recurrenceInterval: number; // 1 = elke week, 2 = elke 2 weken, etc.
  completions: Record<string, { status: KlusjesStatus }>;
  reminder: ReminderOption | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export const STATUS_CONFIG: Record<KlusjesStatus, { label: string; color: string }> = {
  todo: { label: "Te doen", color: "gray" },
  bezig: { label: "Bezig", color: "amber" },
  klaar: { label: "Klaar", color: "green" },
};

export const PRIORITY_CONFIG: Record<KlusjesPriority, { label: string; color: string; bgColor: string }> = {
  1: { label: "Hoog", color: "text-red-600", bgColor: "bg-red-50" },
  2: { label: "Normaal", color: "text-gray-600", bgColor: "bg-gray-50" },
  3: { label: "Laag", color: "text-blue-600", bgColor: "bg-blue-50" },
};

export const RECURRENCE_LABELS: Record<KlusjesRecurrence, string> = {
  none: "Eenmalig",
  daily: "Dagelijks",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
};

export const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: "0", label: "Op het moment zelf" },
  { value: "5", label: "5 minuten ervoor" },
  { value: "15", label: "15 minuten ervoor" },
  { value: "30", label: "30 minuten ervoor" },
  { value: "60", label: "1 uur ervoor" },
  { value: "1440", label: "1 dag ervoor" },
];
