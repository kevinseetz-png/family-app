import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { customCategorySchema, customCategoryDeleteSchema } from "@/lib/validation";
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

  try {
    const snapshot = await adminDb
      .collection("customCategories")
      .where("familyId", "==", user.familyId)
      .get();

    const categories = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        familyId: data.familyId,
        label: data.label,
        emoji: data.emoji,
        colorScheme: data.colorScheme,
      };
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Failed to fetch custom categories:", err);
    return NextResponse.json({ message: "Failed to fetch custom categories" }, { status: 500 });
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

  const result = customCategorySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { label, emoji, colorScheme } = result.data;

  try {
    const docRef = await adminDb.collection("customCategories").add({
      familyId: user.familyId,
      label,
      emoji,
      colorScheme,
    });

    return NextResponse.json(
      {
        category: {
          id: docRef.id,
          familyId: user.familyId,
          label,
          emoji,
          colorScheme,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create custom category:", err);
    return NextResponse.json({ message: "Failed to create custom category" }, { status: 500 });
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

  const result = customCategoryDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id } = result.data;

  try {
    const docRef = adminDb.collection("customCategories").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    if (doc.data()?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete custom category:", err);
    return NextResponse.json({ message: "Failed to delete custom category" }, { status: 500 });
  }
}
