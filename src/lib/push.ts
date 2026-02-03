import webpush from "web-push";
import { adminDb } from "@/lib/firebase-admin";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from "@/lib/vapid";
import type { NotificationPayload } from "@/types/notification";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const TYPE_TO_PREF: Record<NotificationPayload["type"], string> = {
  feeding_reminder: "feedingReminders",
  vitamin_reminder: "vitaminReminders",
  family_activity: "familyActivity",
  medicine_reminder: "medicineReminders",
};

export async function sendNotificationToFamily(
  familyId: string,
  payload: NotificationPayload,
  excludeUserId?: string
): Promise<{ sent: number; failed: number }> {
  const snapshot = await adminDb
    .collection("push_subscriptions")
    .where("familyId", "==", familyId)
    .get();

  let sent = 0;
  let failed = 0;

  const prefKey = TYPE_TO_PREF[payload.type];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (excludeUserId && data.userId === excludeUserId) continue;
    if (prefKey && data[prefKey] === false) continue;

    try {
      await webpush.sendNotification(
        { endpoint: data.endpoint, keys: data.keys },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          type: payload.type,
        })
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await doc.ref.delete();
      }
    }
  }

  return { sent, failed };
}
