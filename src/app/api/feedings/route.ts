import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { feedingSchema, feedingUpdateSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
    const today = startOfDay(new Date());
    const snapshot = await adminDb
      .collection("feedings")
      .where("familyId", "==", user.familyId)
      .limit(1000)
      .get();

    const feedings = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const ts = data.timestamp.toDate();
        return {
          id: doc.id,
          familyId: data.familyId,
          foodType: data.foodType,
          amount: data.amount,
          unit: data.unit,
          loggedBy: data.loggedBy,
          loggedByName: data.loggedByName,
          timestamp: ts.toISOString(),
          createdAt: data.createdAt.toDate().toISOString(),
          _ts: ts.getTime(),
        };
      })
      .filter((f) => f._ts >= today.getTime())
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...f }) => f);

    return NextResponse.json({ feedings });
  } catch (err) {
    console.error("Failed to fetch feedings:", err);
    return NextResponse.json({ message: "Failed to fetch feedings", feedings: [] }, { status: 500 });
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

  const result = feedingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { foodType, amount, unit, timestamp } = result.data;

  const feeding = {
    familyId: user.familyId,
    foodType,
    amount,
    unit,
    loggedBy: user.id,
    loggedByName: user.name,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    createdAt: new Date(),
  };

  const docRef = await adminDb.collection("feedings").add(feeding);

  return NextResponse.json({ id: docRef.id, ...feeding }, { status: 201 });
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

  const { id } = body as { id?: string };
  if (!id || id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const docRef = adminDb.collection("feedings").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ message: "Feeding not found" }, { status: 404 });
  }

  if (doc.data()?.familyId !== user.familyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await docRef.delete();
  return NextResponse.json({ message: "Deleted" });
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

  const result = feedingUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, foodType, amount, unit, timestamp } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const docRef = adminDb.collection("feedings").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ message: "Feeding not found" }, { status: 404 });
  }

  if (doc.data()?.familyId !== user.familyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await docRef.update({
    foodType,
    amount,
    unit,
    timestamp: new Date(timestamp),
  });

  return NextResponse.json({ message: "Updated" });
}
