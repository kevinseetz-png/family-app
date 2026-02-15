export type KlusjesStatus = "todo" | "bezig" | "klaar";
export type KlusjesRecurrence = "none" | "daily" | "weekly" | "monthly";
export type KlusjesPriority = 1 | 2 | 3;

export interface KlusjesItem {
  id: string;
  familyId: string;
  name: string;
  status: KlusjesStatus;
  priority: KlusjesPriority;
  date: string | null;
  recurrence: KlusjesRecurrence;
  completions: Record<string, { status: KlusjesStatus }>;
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
