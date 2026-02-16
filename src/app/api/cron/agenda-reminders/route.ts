import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = toDateStr(now);
  const currentTime = toTimeStr(now);
  let reminded = 0;

  try {
    // Check agenda events with reminders for today
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
        // For all-day events with "1 dag ervoor": notify the day before at 09:00
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
          // "Op het moment zelf" for all-day: notify at 09:00 on the day itself
          if (data.date === today && currentTime >= "09:00" && currentTime < "09:05") {
            shouldNotify = true;
            notifyBody = `Vandaag: ${data.title}`;
          }
        }
      } else if (data.startTime && data.date) {
        // Timed event: calculate when the reminder should fire
        const [hours, minutes] = data.startTime.split(":").map(Number);
        const eventDateTime = new Date(data.date + "T00:00:00");
        eventDateTime.setHours(hours, minutes, 0, 0);

        const reminderTime = new Date(eventDateTime.getTime() - reminderMinutes * 60 * 1000);
        const reminderDateStr = toDateStr(reminderTime);
        const reminderTimeStr = toTimeStr(reminderTime);

        // Check if reminder should fire within 5-minute window
        if (reminderDateStr === today && currentTime >= reminderTimeStr) {
          // Only within 5 minutes of the reminder time
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
        // Check if already sent (dedup)
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

    // Check klusjes (tasks) with reminders and dates for today
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

      // Tasks are all-day by nature, use 09:00 as default time
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
        // All other reminders: notify at 09:00 on the day itself
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

    return NextResponse.json({ reminded });
  } catch (err) {
    console.error("Failed to process agenda reminders:", err);
    return NextResponse.json({ message: "Failed to process reminders" }, { status: 500 });
  }
}
