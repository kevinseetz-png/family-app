import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function runAgendaReminders(): Promise<number> {
  const now = new Date();
  const today = toDateStr(now);
  const currentTime = toTimeStr(now);
  let reminded = 0;

  // Check agenda events with reminders
  const eventsSnap = await adminDb
    .collection("agendaEvents")
    .where("reminder", "!=", null)
    .get();

  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    if (!data.reminder) continue;

    const reminderMinutes = parseInt(data.reminder, 10);
    let shouldNotify = false;
    let notifyBody = "";

    if (data.allDay) {
      if (reminderMinutes === 1440) {
        const eventDate = new Date(data.date + "T00:00:00");
        const dayBefore = new Date(eventDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayBeforeStr = toDateStr(dayBefore);
        if (dayBeforeStr === today && currentTime >= "09:00" && currentTime < "09:05") {
          shouldNotify = true;
          notifyBody = `Morgen: ${data.title}`;
        }
      } else if (reminderMinutes === 0) {
        if (data.date === today && currentTime >= "09:00" && currentTime < "09:05") {
          shouldNotify = true;
          notifyBody = `Vandaag: ${data.title}`;
        }
      }
    } else if (data.startTime && data.date) {
      const [hours, minutes] = data.startTime.split(":").map(Number);
      const eventDateTime = new Date(data.date + "T00:00:00");
      eventDateTime.setHours(hours, minutes, 0, 0);

      const reminderTime = new Date(eventDateTime.getTime() - reminderMinutes * 60 * 1000);
      const reminderDateStr = toDateStr(reminderTime);
      const reminderTimeStr = toTimeStr(reminderTime);

      if (reminderDateStr === today && currentTime >= reminderTimeStr) {
        const reminderMinutesOfDay = reminderTime.getHours() * 60 + reminderTime.getMinutes();
        const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes();
        if (currentMinutesOfDay - reminderMinutesOfDay < 5 && currentMinutesOfDay >= reminderMinutesOfDay) {
          shouldNotify = true;
          notifyBody = reminderMinutes === 0
            ? `Nu: ${data.title}`
            : `Over ${reminderMinutes} min: ${data.title} om ${data.startTime}`;
        }
      }
    }

    if (shouldNotify) {
      const reminderId = `agenda_${doc.id}_${today}`;
      const sentDoc = await adminDb.collection("sentReminders").doc(reminderId).get();
      if (sentDoc.exists) continue;

      await sendNotificationToFamily(data.familyId, {
        title: "Herinnering",
        body: notifyBody,
        url: "/agenda",
        type: "agenda_reminder",
      });

      await adminDb.collection("sentReminders").doc(reminderId).set({
        sentAt: new Date(),
        eventId: doc.id,
      });
      reminded++;
    }
  }

  // Check klusjes with reminders
  const klusjesSnap = await adminDb
    .collection("klusjes")
    .where("reminder", "!=", null)
    .get();

  for (const doc of klusjesSnap.docs) {
    const data = doc.data();
    if (!data.reminder || !data.date) continue;

    const reminderMinutes = parseInt(data.reminder, 10);
    let shouldNotify = false;
    let notifyBody = "";

    if (reminderMinutes === 1440) {
      const taskDate = new Date(data.date + "T00:00:00");
      const dayBefore = new Date(taskDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dayBeforeStr = toDateStr(dayBefore);
      if (dayBeforeStr === today && currentTime >= "09:00" && currentTime < "09:05") {
        shouldNotify = true;
        notifyBody = `Morgen: taak "${data.name}"`;
      }
    } else {
      if (data.date === today && currentTime >= "09:00" && currentTime < "09:05") {
        shouldNotify = true;
        notifyBody = `Vandaag: taak "${data.name}"`;
      }
    }

    if (shouldNotify) {
      const reminderId = `klusje_${doc.id}_${today}`;
      const sentDoc = await adminDb.collection("sentReminders").doc(reminderId).get();
      if (sentDoc.exists) continue;

      await sendNotificationToFamily(data.familyId, {
        title: "Taak herinnering",
        body: notifyBody,
        url: "/klusjes",
        type: "agenda_reminder",
      });

      await adminDb.collection("sentReminders").doc(reminderId).set({
        sentAt: new Date(),
        klusjeId: doc.id,
      });
      reminded++;
    }
  }

  return reminded;
}

async function runVitaminReminders(): Promise<number> {
  const today = toDateStr(new Date());
  const families = await adminDb.collection("families").get();
  let reminded = 0;

  for (const family of families.docs) {
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

  return reminded;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const [agendaReminded, vitaminReminded] = await Promise.all([
      runAgendaReminders(),
      runVitaminReminders(),
    ]);

    return NextResponse.json({ agendaReminded, vitaminReminded });
  } catch (err) {
    console.error("Failed to run cron jobs:", err);
    return NextResponse.json({ message: "Failed to run cron jobs" }, { status: 500 });
  }
}
