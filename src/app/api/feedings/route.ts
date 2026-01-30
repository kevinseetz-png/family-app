import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { feedingSchema } from "@/lib/validation";
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

  const result = feedingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { babyName, amount, unit, timestamp } = result.data;

  // Convert oz to ml for storage
  const amountMl = unit === "oz" ? Math.round(amount * 29.5735) : amount;

  const feeding = {
    familyId: user.familyId,
    babyName,
    amount: amountMl,
    unit,
    loggedBy: user.id,
    loggedByName: user.name,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    createdAt: new Date(),
  };

  const docRef = await adminDb.collection("feedings").add(feeding);

  return NextResponse.json({ id: docRef.id, ...feeding }, { status: 201 });
}
