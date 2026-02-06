import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { processMedicineReminders } from "./medicine-reminder";

const vapidPublicKey = defineSecret("VAPID_PUBLIC_KEY");
const vapidPrivateKey = defineSecret("VAPID_PRIVATE_KEY");
const vapidSubject = defineSecret("VAPID_SUBJECT");

export const medicineReminder = onSchedule(
  {
    schedule: "every 10 minutes",
    region: "europe-west1",
    secrets: [vapidPublicKey, vapidPrivateKey, vapidSubject],
  },
  async () => {
    const reminded = await processMedicineReminders({
      publicKey: vapidPublicKey.value(),
      privateKey: vapidPrivateKey.value(),
      subject: vapidSubject.value(),
    });

    logger.info(`Medicine reminders complete: ${reminded} sent`);
  }
);
