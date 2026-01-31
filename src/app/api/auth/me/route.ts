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
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // Refresh role from Firestore so stale JWTs don't hide admin access
  const doc = await adminDb.collection("users").doc(user.id).get();
  if (doc.exists) {
    const data = doc.data();
    if (data?.role === "admin") {
      user.role = "admin";
    }
  }

  return NextResponse.json({ user });
}
