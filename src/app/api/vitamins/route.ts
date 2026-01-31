import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { vitaminToggleSchema } from "@/lib/validation";
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

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ message: "Invalid date" }, { status: 400 });
  }

  try {
    const snapshot = await adminDb
      .collection("vitamins")
      .where("familyId", "==", user.familyId)
      .where("date", "==", date)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ checked: false });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return NextResponse.json({
      checked: true,
      checkedByName: data.checkedByName,
      checkedAt: data.checkedAt.toDate().toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch vitamin status:", err);
    return NextResponse.json({ message: "Failed to fetch vitamin status" }, { status: 500 });
  }
}

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

  const result = vitaminToggleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { date } = result.data;

  try {
    const snapshot = await adminDb
      .collection("vitamins")
      .where("familyId", "==", user.familyId)
      .where("date", "==", date)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      return NextResponse.json({ checked: false });
    }

    await adminDb.collection("vitamins").add({
      familyId: user.familyId,
      date,
      checkedBy: user.id,
      checkedByName: user.name,
      checkedAt: new Date(),
    });

    return NextResponse.json({ checked: true, checkedByName: user.name }, { status: 201 });
  } catch (err) {
    console.error("Failed to toggle vitamin:", err);
    return NextResponse.json({ message: "Failed to toggle vitamin" }, { status: 500 });
  }
}
