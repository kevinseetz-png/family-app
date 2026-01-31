import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const QUIET_START = 22; // 22:00
const QUIET_END = 7;    // 07:00

function isDuringQuietHours(): boolean {
  const hour = new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam", hour: "numeric", hour12: false });
  const h = parseInt(hour, 10);
  return h >= QUIET_START || h < QUIET_END;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (isDuringQuietHours()) {
    return NextResponse.json({ reminded: 0, skipped: "quiet_hours" });
  }

  const families = await adminDb.collection("families").get();
  let reminded = 0;

  for (const family of families.docs) {
    const feedingsSnap = await adminDb
      .collection("feedings")
      .where("familyId", "==", family.id)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (feedingsSnap.docs.length === 0) continue;

    const lastFeeding = feedingsSnap.docs[0].data();
    const lastTimestamp = lastFeeding.timestamp.toDate();
    const elapsed = Date.now() - lastTimestamp.getTime();

    if (elapsed >= FOUR_HOURS_MS) {
      await sendNotificationToFamily(family.id, {
        title: "Voedingsherinnering",
        body: "De laatste voeding was meer dan 4 uur geleden",
        url: "/feeding",
        type: "feeding_reminder",
      });
      reminded++;
    }
  }

  return NextResponse.json({ reminded });
}
