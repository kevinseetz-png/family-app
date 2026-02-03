export interface Medicine {
  id: string;
  familyId: string;
  name: string;
  reminderHour: number;
  reminderMinute: number;
  active: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export interface MedicineCheck {
  id: string;
  familyId: string;
  medicineId: string;
  date: string;
  checkedBy: string;
  checkedByName: string;
  checkedAt: Date;
}

export interface MedicineWithStatus extends Medicine {
  checkedToday: boolean;
  checkedByName?: string;
}
