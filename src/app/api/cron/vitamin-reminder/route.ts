import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

const TZ = "Europe/Amsterdam";

function getNow(): { date: string; minutesOfDay: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hours = parseInt(get("hour"), 10);
  const minutes = parseInt(get("minute"), 10);

  return { date, minutesOfDay: hours * 60 + minutes };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { date: today, minutesOfDay: currentMinutes } = getNow();
  const families = await adminDb.collection("families").get();
  let reminded = 0;

  for (const family of families.docs) {
    const familyData = family.data();
    const reminderHour = typeof familyData.vitaminReminderHour === "number" ? familyData.vitaminReminderHour : 10;
    const targetMinutes = reminderHour * 60;

    // Only send within 5-minute window of configured reminder time
    if (currentMinutes < targetMinutes || currentMinutes - targetMinutes >= 5) continue;

    const vitaminSnap = await adminDb
      .collection("vitamins")
      .where("familyId", "==", family.id)
      .where("date", "==", today)
      .get();

    if (vitaminSnap.docs.length === 0) {
      const reminderId = `vitamin_${family.id}_${today}`;
      const sentDoc = await adminDb.collection("sentReminders").doc(reminderId).get();
      if (sentDoc.exists) continue;

      await sendNotificationToFamily(family.id, {
        title: "Vitamine D herinnering",
        body: "Vergeet niet de vitamine D te geven vandaag!",
        url: "/feeding",
        type: "vitamin_reminder",
      });

      await adminDb.collection("sentReminders").doc(reminderId).set({
        sentAt: new Date(),
        familyId: family.id,
      });
      reminded++;
    }
  }

  return NextResponse.json({ reminded });
}
