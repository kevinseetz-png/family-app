import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { BUILT_IN_CATEGORIES } from "@/types/agenda";

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

  const { category } = body as { category?: string };
  if (!category || typeof category !== "string") {
    return NextResponse.json({ message: "Category is required" }, { status: 400 });
  }

  if (!BUILT_IN_CATEGORIES.includes(category as (typeof BUILT_IN_CATEGORIES)[number])) {
    return NextResponse.json({ message: "Invalid built-in category" }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection("categorySettings").doc(user.familyId);
    const doc = await docRef.get();
    const currentHidden: string[] = doc.exists ? (doc.data()?.hiddenBuiltIn ?? []) : [];

    let newHidden: string[];
    if (currentHidden.includes(category)) {
      // Restore (remove from hidden)
      newHidden = currentHidden.filter((c) => c !== category);
    } else {
      // Hide (add to hidden) — but keep at least one visible
      const visibleCount = BUILT_IN_CATEGORIES.length - currentHidden.length;
      if (visibleCount <= 1) {
        return NextResponse.json({ message: "Er moet minimaal één categorie actief zijn" }, { status: 400 });
      }
      newHidden = [...currentHidden, category];
    }

    await docRef.set({ hiddenBuiltIn: newHidden }, { merge: true });

    return NextResponse.json({ hiddenBuiltIn: newHidden });
  } catch (err) {
    console.error("Failed to toggle built-in category:", err);
    return NextResponse.json({ message: "Failed to update category settings" }, { status: 500 });
  }
}
