import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const families = await adminDb.collection("families").get();
  let reminded = 0;

  for (const family of families.docs) {
    const vitaminSnap = await adminDb
      .collection("vitamins")
      .where("familyId", "==", family.id)
      .where("date", "==", today)
      .get();

    if (vitaminSnap.docs.length === 0) {
      await sendNotificationToFamily(family.id, {
        title: "Vitamine D herinnering",
        body: "Vergeet niet de vitamine D te geven vandaag!",
        url: "/feeding",
        type: "vitamin_reminder",
      });
      reminded++;
    }
  }

  return NextResponse.json({ reminded });
}
