import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { klusjesSchema, klusjesUpdateSchema, klusjesDeleteSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { sendNotificationToFamily } from "@/lib/push";

const MAX_ITEMS_PER_REQUEST = 1000;

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
      .collection("klusjes")
      .where("familyId", "==", user.familyId)
      .limit(MAX_ITEMS_PER_REQUEST)
      .get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate();

        // Read-time migration: checked boolean → status string
        let status: string;
        if (data.status) {
          status = data.status;
        } else if (data.checked === true) {
          status = "klaar";
        } else {
          status = "todo";
        }

        return {
          id: doc.id,
          familyId: data.familyId,
          name: data.name,
          status,
          date: data.date ?? null,
          recurrence: data.recurrence ?? "none",
          completions: data.completions ?? {},
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
    console.error("Failed to fetch klusjes:", err);
    return NextResponse.json({ message: "Failed to fetch klusjes", items: [] }, { status: 500 });
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

  const result = klusjesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, date, recurrence } = result.data;

  try {
    const item = {
      familyId: user.familyId,
      name,
      status: "todo",
      date: date ?? null,
      recurrence: recurrence ?? "none",
      completions: {},
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("klusjes").add(item);

    sendNotificationToFamily(
      user.familyId,
      {
        title: "Nieuw klusje",
        body: `${user.name} heeft "${name}" toegevoegd`,
        url: "/klusjes",
        type: "family_activity",
      },
      user.id
    ).catch(() => {});

    return NextResponse.json({ id: docRef.id, ...item }, { status: 201 });
  } catch (err) {
    console.error("Failed to add klusje:", err);
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

  const result = klusjesUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, status, completionDate, date, recurrence } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection("klusjes").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (doc.data()?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (completionDate) {
      // Double-validate date format before dot-notation to prevent injection
      if (!/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
        return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
      }
      // Recurring item: update completions map with dot-notation
      await docRef.update({
        [`completions.${completionDate}`]: { status },
      });
    } else {
      // Normal update
      const updateData: Record<string, unknown> = { status };
      if (date !== undefined) updateData.date = date;
      if (recurrence !== undefined) updateData.recurrence = recurrence;
      await docRef.update(updateData);
    }

    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    console.error("Failed to update klusje:", err);
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

  const result = klusjesDeleteSchema.safeParse(body);
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
    const docRef = adminDb.collection("klusjes").doc(id);
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
    console.error("Failed to delete klusje:", err);
    return NextResponse.json({ message: "Failed to delete item" }, { status: 500 });
  }
}
