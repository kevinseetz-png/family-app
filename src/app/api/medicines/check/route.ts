import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { medicineCheckSchema } from "@/lib/validation";
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

  const result = medicineCheckSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { medicineId, date } = result.data;

  try {
    // Verify the medicine exists and belongs to the user's family
    const medicineDoc = await adminDb.collection("medicines").doc(medicineId).get();

    if (!medicineDoc.exists) {
      return NextResponse.json({ message: "Medicine not found" }, { status: 404 });
    }

    const medicineData = medicineDoc.data();
    if (medicineData?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Check if already checked today
    const existingCheck = await adminDb
      .collection("medicine_checks")
      .where("familyId", "==", user.familyId)
      .where("medicineId", "==", medicineId)
      .where("date", "==", date)
      .limit(1)
      .get();

    if (!existingCheck.empty) {
      // Toggle off - delete the check
      await existingCheck.docs[0].ref.delete();
      return NextResponse.json({ checked: false });
    }

    // Create new check
    await adminDb.collection("medicine_checks").add({
      familyId: user.familyId,
      medicineId,
      date,
      checkedBy: user.id,
      checkedByName: user.name,
      checkedAt: new Date(),
    });

    return NextResponse.json(
      { checked: true, checkedByName: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to toggle medicine check:", err);
    return NextResponse.json({ message: "Failed to toggle check" }, { status: 500 });
  }
}
