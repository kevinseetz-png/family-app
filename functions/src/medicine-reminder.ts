import { db } from "./lib/firebase";
import { sendNotificationToFamily } from "./lib/push";
import { logger } from "firebase-functions/v2";

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export async function processMedicineReminders(
  vapid: VapidConfig
): Promise<number> {
  const now = new Date();
  // Use Netherlands timezone since users enter times in local time
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const currentHour = Number(get("hour"));
  const currentMinute = Number(get("minute"));
  const today = `${get("year")}-${get("month")}-${get("day")}`;

  // Calculate the 10-minute window: e.g. minute 23 → window [20, 21, ..., 29]
  const windowStart = Math.floor(currentMinute / 10) * 10;
  const minuteRange = Array.from({ length: 10 }, (_, i) => windowStart + i);

  logger.info(
    `Checking medicines for hour=${currentHour}, minutes=${windowStart}-${windowStart + 9}`
  );

  // Firestore "in" operator supports up to 30 values, 10 is fine
  const medicinesSnapshot = await db
    .collection("medicines")
    .where("active", "==", true)
    .where("reminderHour", "==", currentHour)
    .where("reminderMinute", "in", minuteRange)
    .get();

  let reminded = 0;

  for (const medicineDoc of medicinesSnapshot.docs) {
    const medicine = medicineDoc.data();

    // Check if this medicine has already been checked today
    const checkSnapshot = await db
      .collection("medicine_checks")
      .where("familyId", "==", medicine.familyId)
      .where("medicineId", "==", medicineDoc.id)
      .where("date", "==", today)
      .get();

    if (checkSnapshot.empty) {
      await sendNotificationToFamily(
        medicine.familyId,
        {
          title: "Medicijn herinnering",
          body: `Vergeet niet om ${medicine.name} te nemen!`,
          url: "/medicijn",
          type: "medicine_reminder",
        },
        vapid
      );
      reminded++;
    }
  }

  return reminded;
}
