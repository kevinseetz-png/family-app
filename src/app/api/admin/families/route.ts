import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const familiesSnapshot = await adminDb.collection("families").get();
    const families = await Promise.all(
      familiesSnapshot.docs.map(async (doc) => {
        const familyData = doc.data();
        const usersSnapshot = await adminDb
          .collection("users")
          .where("familyId", "==", doc.id)
          .get();

        return {
          id: doc.id,
          name: familyData.name,
          memberCount: usersSnapshot.size,
          createdAt: familyData.createdAt,
        };
      })
    );

    return NextResponse.json({ families });
  } catch (error) {
    console.error("Error fetching families:", error);
    return NextResponse.json(
      { message: "Failed to fetch families" },
      { status: 500 }
    );
  }
}
