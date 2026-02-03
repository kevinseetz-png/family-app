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
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const today = now.toISOString().split("T")[0];

  let reminded = 0;

  try {
    // Get all active medicines that have a reminder at the current hour and minute
    const medicinesSnapshot = await adminDb
      .collection("medicines")
      .where("active", "==", true)
      .where("reminderHour", "==", currentHour)
      .where("reminderMinute", "==", currentMinute)
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
