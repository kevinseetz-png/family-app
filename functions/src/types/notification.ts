export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type: "feeding_reminder" | "vitamin_reminder" | "family_activity" | "medicine_reminder";
}
