export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface PushSubscriptionDoc {
  id: string;
  userId: string;
  familyId: string;
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  feedingReminders: boolean;
  vitaminReminders: boolean;
  familyActivity: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  feedingReminders: boolean;
  vitaminReminders: boolean;
  familyActivity: boolean;
  medicineReminders: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type: "feeding_reminder" | "vitamin_reminder" | "family_activity" | "medicine_reminder";
}
