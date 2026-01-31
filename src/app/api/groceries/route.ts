import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { grocerySchema, groceryUpdateSchema, groceryDeleteSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

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
      .collection("groceries")
      .where("familyId", "==", user.familyId)
      .limit(1000)
      .get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate();
        return {
          id: doc.id,
          familyId: data.familyId,
          name: data.name,
          checked: data.checked,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: createdAt.toISOString(),
          _ts: createdAt.getTime(),
        };
      })
      .sort((a, b) => a._ts - b._ts)
      .map(({ _ts, ...item }) => item);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to fetch groceries:", err);
    return NextResponse.json({ message: "Failed to fetch groceries", items: [] }, { status: 500 });
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

  const result = grocerySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name } = result.data;

  try {
    const item = {
      familyId: user.familyId,
      name,
      checked: false,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("groceries").add(item);

    sendNotificationToFamily(
      user.familyId,
      {
        title: "Nieuw boodschapje",
        body: `${user.name} heeft "${name}" toegevoegd`,
        url: "/boodschappen",
        type: "family_activity",
      },
      user.id
    ).catch(() => {});

    return NextResponse.json({ id: docRef.id, ...item }, { status: 201 });
  } catch (err) {
    console.error("Failed to add grocery:", err);
    return NextResponse.json({ message: "Failed to add item" }, { status: 500 });
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

  const result = groceryUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, checked } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection("groceries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (doc.data()?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await docRef.update({ checked });
    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("Failed to update grocery:", err);
    return NextResponse.json({ message: "Failed to update item" }, { status: 500 });
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

  const result = groceryDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection("groceries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (doc.data()?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Failed to delete grocery:", err);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
}
