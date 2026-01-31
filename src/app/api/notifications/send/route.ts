import { NextRequest, NextResponse } from "next/server";
import { sendNotificationToFamily } from "@/lib/push";
import type { NotificationPayload } from "@/types/notification";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { familyId, type, title, body: notifBody, url, excludeUserId } = body as {
    familyId?: string;
    type?: NotificationPayload["type"];
    title?: string;
    body?: string;
    url?: string;
    excludeUserId?: string;
  };

  if (!familyId || !type || !title || !notifBody) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const result = await sendNotificationToFamily(
    familyId,
    { title, body: notifBody, url, type },
    excludeUserId
  );

  return NextResponse.json(result);
}
