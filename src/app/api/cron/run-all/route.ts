import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

const TZ = "Europe/Amsterdam";

/** Get current date/time components in Dutch timezone */
function getNow(): { date: string; time: string; minutesOfDay: number } {
  const now = new Date();
  // Format in Dutch timezone
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
  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return { date, time, minutesOfDay: hours * 60 + minutes };
}

/** Parse "HH:mm" to minutes-of-day */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Subtract days from a date string, returns "YYYY-MM-DD" */
function subtractDay(dateStr: string): string {
  // Parse in Dutch timezone to avoid UTC shift
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid DST edge
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Subtract minutes from a time, may cross midnight (returns { date offset, time }) */
function subtractMinutesFromTime(dateStr: string, time: string, minutes: number): { date: string; time: string; minutesOfDay: number } {
  let totalMin = timeToMinutes(time) - minutes;
  let resultDate = dateStr;
  if (totalMin < 0) {
    totalMin += 1440;
    resultDate = subtractDay(dateStr);
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return {
    date: resultDate,
    time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    minutesOfDay: totalMin,
  };
}

async function runAgendaReminders(): Promise<number> {
  const { date: today, time: currentTime, minutesOfDay: currentMinutes } = getNow();
  let reminded = 0;

  /**
   * Check if a reminder should fire right now.
   * All times are already in Dutch timezone (from getNow / stored by user).
   * Returns true if the reminder target time is within the last 5 minutes.
   */
  function isInWindow(targetDate: string, targetTime: string): boolean {
    if (targetDate !== today) return false;
    const targetMin = timeToMinutes(targetTime);
    return currentMinutes >= targetMin && currentMinutes - targetMin < 5;
  }

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
        // Day before at 09:00
        const dayBefore = subtractDay(data.date);
        if (isInWindow(dayBefore, "09:00")) {
          shouldNotify = true;
          notifyBody = `Morgen: ${data.title}`;
        }
      } else if (reminderMinutes === 0) {
        // Day itself at 09:00
        if (isInWindow(data.date, "09:00")) {
          shouldNotify = true;
          notifyBody = `Vandaag: ${data.title}`;
        }
      }
    } else if (data.startTime && data.date) {
      // Timed event: reminder fires (startTime - reminderMinutes)
      const target = subtractMinutesFromTime(data.date, data.startTime, reminderMinutes);
      if (isInWindow(target.date, target.time)) {
        shouldNotify = true;
        notifyBody = reminderMinutes === 0
          ? `Nu: ${data.title}`
          : `Over ${reminderMinutes} min: ${data.title} om ${data.startTime}`;
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
    const taskTime: string | null = data.time ?? null;

    if (taskTime) {
      // Task has a specific time — calculate reminder relative to that time
      if (reminderMinutes === 1440) {
        // "1 dag ervoor" at the task's time
        const dayBefore = subtractDay(data.date);
        if (isInWindow(dayBefore, taskTime)) {
          shouldNotify = true;
          notifyBody = `Morgen om ${taskTime}: taak "${data.name}"`;
        }
      } else {
        const target = subtractMinutesFromTime(data.date, taskTime, reminderMinutes);
        if (isInWindow(target.date, target.time)) {
          shouldNotify = true;
          notifyBody = reminderMinutes === 0
            ? `Nu: taak "${data.name}"`
            : `Over ${reminderMinutes} min: taak "${data.name}" om ${taskTime}`;
        }
      }
    } else {
      // No time set — use 09:00 as default
      if (reminderMinutes === 1440) {
        const dayBefore = subtractDay(data.date);
        if (isInWindow(dayBefore, "09:00")) {
          shouldNotify = true;
          notifyBody = `Morgen: taak "${data.name}"`;
        }
      } else {
        if (isInWindow(data.date, "09:00")) {
          shouldNotify = true;
          notifyBody = `Vandaag: taak "${data.name}"`;
        }
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
  const { date: today } = getNow();
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
