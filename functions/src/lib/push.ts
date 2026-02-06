import webpush from "web-push";
import { db } from "./firebase";
import type { NotificationPayload } from "../types/notification";

const TYPE_TO_PREF: Record<NotificationPayload["type"], string> = {
  feeding_reminder: "feedingReminders",
  vitamin_reminder: "vitaminReminders",
  family_activity: "familyActivity",
  medicine_reminder: "medicineReminders",
};

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export async function sendNotificationToFamily(
  familyId: string,
  payload: NotificationPayload,
  vapid: VapidConfig
): Promise<{ sent: number; failed: number }> {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const snapshot = await db
    .collection("push_subscriptions")
    .where("familyId", "==", familyId)
    .get();

  let sent = 0;
  let failed = 0;

  const prefKey = TYPE_TO_PREF[payload.type];

  for (const doc of snapshot.docs) {
    const data = doc.data();

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
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
        await doc.ref.delete();
      }
    }
  }

  return { sent, failed };
}
