import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { medicineSchema, medicineUpdateSchema, medicineDeleteSchema } from "@/lib/validation";
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

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Get all medicines for this family
    const medicinesSnapshot = await adminDb
      .collection("medicines")
      .where("familyId", "==", user.familyId)
      .orderBy("createdAt", "desc")
      .get();

    // Get today's checks for this family
    const checksSnapshot = await adminDb
      .collection("medicine_checks")
      .where("familyId", "==", user.familyId)
      .where("date", "==", today)
      .get();

    const checksMap = new Map<string, string>();
    checksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      checksMap.set(data.medicineId, data.checkedByName);
    });

    const medicines = medicinesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const checkedByName = checksMap.get(doc.id);
      return {
        id: doc.id,
        familyId: data.familyId,
        name: data.name,
        reminderHour: data.reminderHour,
        reminderMinute: data.reminderMinute,
        active: data.active,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt.toDate().toISOString(),
        checkedToday: !!checkedByName,
        checkedByName,
      };
    });

    return NextResponse.json({ medicines });
  } catch (err) {
    console.error("Failed to fetch medicines:", err);
    return NextResponse.json({ message: "Failed to fetch medicines" }, { status: 500 });
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

  const result = medicineSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, reminderHour, reminderMinute } = result.data;

  try {
    const docRef = await adminDb.collection("medicines").add({
      familyId: user.familyId,
      name,
      reminderHour,
      reminderMinute,
      active: true,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        medicine: {
          id: docRef.id,
          familyId: user.familyId,
          name,
          reminderHour,
          reminderMinute,
          active: true,
          createdBy: user.id,
          createdByName: user.name,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create medicine:", err);
    return NextResponse.json({ message: "Failed to create medicine" }, { status: 500 });
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

  const result = medicineUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, ...updates } = result.data;

  try {
    const docRef = adminDb.collection("medicines").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Medicine not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update medicine:", err);
    return NextResponse.json({ message: "Failed to update medicine" }, { status: 500 });
  }
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

  const result = medicineDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id } = result.data;

  try {
    const docRef = adminDb.collection("medicines").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Medicine not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete associated checks
    const checksSnapshot = await adminDb
      .collection("medicine_checks")
      .where("medicineId", "==", id)
      .get();

    for (const checkDoc of checksSnapshot.docs) {
      await checkDoc.ref.delete();
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete medicine:", err);
    return NextResponse.json({ message: "Failed to delete medicine" }, { status: 500 });
  }
}
