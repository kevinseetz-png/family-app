import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { pushSubscriptionSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const result = pushSubscriptionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { endpoint, keys } = result.data;

  const existing = await adminDb
    .collection("push_subscriptions")
    .where("userId", "==", user.id)
    .where("endpoint", "==", endpoint)
    .get();

  if (existing.docs.length > 0) {
    await existing.docs[0].ref.update({ keys, familyId: user.familyId });
    return NextResponse.json({ id: existing.docs[0].id, message: "Updated" });
  }

  const doc = {
    userId: user.id,
    familyId: user.familyId,
    endpoint,
    keys,
    feedingReminders: true,
    vitaminReminders: true,
    medicineReminders: true,
    familyActivity: true,
    createdAt: new Date(),
  };

  const docRef = await adminDb.collection("push_subscriptions").add(doc);
  return NextResponse.json({ id: docRef.id, ...doc }, { status: 201 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

  const { endpoint } = body as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ message: "Endpoint required" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("push_subscriptions")
    .where("userId", "==", user.id)
    .where("endpoint", "==", endpoint)
    .get();

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }

  return NextResponse.json({ message: "Unsubscribed" });
}
