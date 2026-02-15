import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { agendaEventSchema, agendaEventUpdateSchema, agendaEventDeleteSchema } from "@/lib/validation";
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
      .collection("agendaEvents")
      .where("familyId", "==", user.familyId)
      .get();

    const events = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          familyId: data.familyId,
          title: data.title,
          description: data.description || "",
          category: data.category,
          date: data.date,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          allDay: data.allDay ?? true,
          recurrence: data.recurrence || "none",
          assignedTo: data.assignedTo || null,
          birthdayGroup: data.birthdayGroup ?? null,
          birthYear: data.birthYear ?? null,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        };
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Failed to fetch agenda events:", err);
    return NextResponse.json({ message: "Failed to fetch agenda events" }, { status: 500 });
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

  const result = agendaEventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = result.data;

  try {
    const docRef = await adminDb.collection("agendaEvents").add({
      familyId: user.familyId,
      ...data,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        event: {
          id: docRef.id,
          familyId: user.familyId,
          ...data,
          createdBy: user.id,
          createdByName: user.name,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create agenda event:", err);
    return NextResponse.json({ message: "Failed to create agenda event" }, { status: 500 });
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

  const result = agendaEventUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, ...updates } = result.data;

  try {
    const docRef = adminDb.collection("agendaEvents").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const docData = doc.data();
    if (docData?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update agenda event:", err);
    return NextResponse.json({ message: "Failed to update agenda event" }, { status: 500 });
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

  const result = agendaEventDeleteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id } = result.data;

  try {
    const docRef = adminDb.collection("agendaEvents").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const docData = doc.data();
    if (docData?.familyId !== user.familyId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete agenda event:", err);
    return NextResponse.json({ message: "Failed to delete agenda event" }, { status: 500 });
  }
}
