import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { supermarktFavoriteSchema, supermarktFavoriteDeleteSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const snapshot = await adminDb
      .collection("supermarkt_favorites")
      .where("familyId", "==", user.familyId)
      .limit(100)
      .get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate();
        return {
          id: doc.id,
          familyId: data.familyId,
          name: data.name,
          createdBy: data.createdBy,
          createdAt: createdAt.toISOString(),
          _ts: createdAt.getTime(),
        };
      })
      .sort((a, b) => a._ts - b._ts)
      .map(({ _ts, ...item }) => item);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to fetch supermarkt favorites:", err);
    return NextResponse.json({ message: "Failed to fetch favorites", items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = supermarktFavoriteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name } = result.data;

  // Check for duplicate
  const existing = await adminDb
    .collection("supermarkt_favorites")
    .where("familyId", "==", user.familyId)
    .where("name", "==", name)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ message: "Favoriet bestaat al" }, { status: 409 });
  }

  try {
    const item = {
      familyId: user.familyId,
      name,
      createdBy: user.id,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("supermarkt_favorites").add(item);
    return NextResponse.json({ id: docRef.id, ...item }, { status: 201 });
  } catch (err) {
    console.error("Failed to add supermarkt favorite:", err);
    return NextResponse.json({ message: "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = supermarktFavoriteDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { id } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection("supermarkt_favorites").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Favoriet niet gevonden" }, { status: 404 });
    }

    if (doc.data()?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Failed to delete supermarkt favorite:", err);
    return NextResponse.json({ message: "Failed to delete favorite" }, { status: 500 });
  }
}
