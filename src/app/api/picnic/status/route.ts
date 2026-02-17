import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const doc = await adminDb
      .collection("picnic_connections")
      .doc(user.familyId)
      .get();

    const data = doc.data();
    if (!doc.exists || typeof data?.authKey !== "string") {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ connected: true });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    await adminDb
      .collection("picnic_connections")
      .doc(user.familyId)
      .delete();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Kon verbinding niet verwijderen" },
      { status: 500 }
    );
  }
}
