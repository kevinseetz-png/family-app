import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { mealSchema, mealUpdateSchema, mealDeleteSchema } from "@/lib/validation";
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
    // Query without orderBy to avoid composite index requirement
    // Sort in JavaScript instead
    const snapshot = await adminDb
      .collection("meals")
      .where("familyId", "==", user.familyId)
      .get();

    const meals = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          familyId: data.familyId,
          name: data.name,
          ingredients: data.ingredients || "",
          instructions: data.instructions || "",
          sourceDay: data.sourceDay,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ meals });
  } catch (err) {
    console.error("Failed to fetch meals:", err);
    return NextResponse.json({ message: "Failed to fetch meals" }, { status: 500 });
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

  const result = mealSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, ingredients, instructions, sourceDay } = result.data;

  try {
    // Check for existing meal with same name (case-insensitive) to prevent duplicates
    const existingSnap = await adminDb
      .collection("meals")
      .where("familyId", "==", user.familyId)
      .get();

    const existingDoc = existingSnap.docs.find(
      (doc) => doc.data().name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (existingDoc) {
      // Update existing meal with new ingredients if provided
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (ingredients) updates.ingredients = ingredients;
      if (instructions) updates.instructions = instructions;
      await existingDoc.ref.update(updates);

      const data = existingDoc.data();
      return NextResponse.json(
        {
          meal: {
            id: existingDoc.id,
            familyId: data.familyId,
            name: data.name,
            ingredients: ingredients || data.ingredients || "",
            instructions: instructions || data.instructions || "",
            sourceDay: data.sourceDay,
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          updated: true,
        },
        { status: 200 }
      );
    }

    const docRef = await adminDb.collection("meals").add({
      familyId: user.familyId,
      name,
      ingredients: ingredients || "",
      instructions: instructions || "",
      sourceDay,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        meal: {
          id: docRef.id,
          familyId: user.familyId,
          name,
          ingredients: ingredients || "",
          instructions: instructions || "",
          sourceDay,
          createdBy: user.id,
          createdByName: user.name,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create meal:", err);
    return NextResponse.json({ message: "Failed to create meal" }, { status: 500 });
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

  const result = mealUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, ...updates } = result.data;

  try {
    const docRef = adminDb.collection("meals").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Meal not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update meal:", err);
    return NextResponse.json({ message: "Failed to update meal" }, { status: 500 });
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

  const result = mealDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id } = result.data;

  try {
    const docRef = adminDb.collection("meals").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Meal not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete meal:", err);
    return NextResponse.json({ message: "Failed to delete meal" }, { status: 500 });
  }
}
