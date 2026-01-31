import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { weekMenuSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";

const EMPTY_DAYS = { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };

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
    const snapshot = await adminDb
      .collection("weekmenus")
      .where("familyId", "==", user.familyId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ menu: { days: EMPTY_DAYS } });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return NextResponse.json({
      menu: {
        id: doc.id,
        familyId: data.familyId,
        days: data.days,
        updatedBy: data.updatedBy,
        updatedByName: data.updatedByName,
        updatedAt: data.updatedAt.toDate().toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to fetch week menu:", err);
    return NextResponse.json({ message: "Failed to fetch week menu" }, { status: 500 });
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

  const result = weekMenuSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { days } = result.data;

  try {
    const snapshot = await adminDb
      .collection("weekmenus")
      .where("familyId", "==", user.familyId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      await adminDb.collection("weekmenus").add({
        familyId: user.familyId,
        days,
        updatedBy: user.id,
        updatedByName: user.name,
        updatedAt: new Date(),
      });
    } else {
      await snapshot.docs[0].ref.update({
        days,
        updatedBy: user.id,
        updatedByName: user.name,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ message: "Saved" });
  } catch (err) {
    console.error("Failed to save week menu:", err);
    return NextResponse.json({ message: "Failed to save week menu" }, { status: 500 });
  }
}
