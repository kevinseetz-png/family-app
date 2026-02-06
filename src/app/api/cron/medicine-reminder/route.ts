import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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

  // 10-minute window to accommodate cron scheduling granularity
  const windowStart = Math.floor(currentMinute / 10) * 10;
  const minuteRange = Array.from({ length: 10 }, (_, i) => windowStart + i);

  let reminded = 0;

  try {
    // Get all active medicines that have a reminder in the current 10-minute window
    const medicinesSnapshot = await adminDb
      .collection("medicines")
      .where("active", "==", true)
      .where("reminderHour", "==", currentHour)
      .where("reminderMinute", "in", minuteRange)
      .get();

    for (const medicineDoc of medicinesSnapshot.docs) {
      const medicine = medicineDoc.data();

      // Check if this medicine has been checked today
      const checkSnapshot = await adminDb
        .collection("medicine_checks")
        .where("familyId", "==", medicine.familyId)
        .where("medicineId", "==", medicineDoc.id)
        .where("date", "==", today)
        .get();

      if (checkSnapshot.empty) {
        // Send reminder notification
        await sendNotificationToFamily(medicine.familyId, {
          title: "Medicijn herinnering",
          body: `Vergeet niet om ${medicine.name} te nemen!`,
          url: "/medicijn",
          type: "medicine_reminder",
        });
        reminded++;
      }
    }

    return NextResponse.json({ reminded });
  } catch (err) {
    console.error("Failed to process medicine reminders:", err);
    return NextResponse.json({ message: "Failed to process reminders" }, { status: 500 });
  }
}
