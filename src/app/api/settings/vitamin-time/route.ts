import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const familyDoc = await adminDb.collection("families").doc(user.familyId).get();
    const vitaminReminderHour = familyDoc.data()?.vitaminReminderHour ?? 10;
    return NextResponse.json({ vitaminReminderHour });
  } catch (err) {
    console.error("Failed to fetch vitamin reminder time:", err);
    return NextResponse.json({ message: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  if (
    typeof body !== "object" ||
    body === null ||
    typeof parsed.vitaminReminderHour !== "number" ||
    parsed.vitaminReminderHour < 0 ||
    parsed.vitaminReminderHour > 23
  ) {
    return NextResponse.json({ message: "vitaminReminderHour must be 0-23" }, { status: 400 });
  }

  const vitaminReminderHour = parsed.vitaminReminderHour;

  try {
    await adminDb.collection("families").doc(user.familyId).update({ vitaminReminderHour });
    return NextResponse.json({ vitaminReminderHour });
  } catch (err) {
    console.error("Failed to save vitamin reminder time:", err);
    return NextResponse.json({ message: "Failed to save setting" }, { status: 500 });
  }
}
