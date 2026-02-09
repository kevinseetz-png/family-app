export type KlusjesStatus = "todo" | "bezig" | "klaar";
export type KlusjesRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface KlusjesItem {
  id: string;
  familyId: string;
  name: string;
  status: KlusjesStatus;
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

export const RECURRENCE_LABELS: Record<KlusjesRecurrence, string> = {
  none: "Eenmalig",
  daily: "Dagelijks",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
};
