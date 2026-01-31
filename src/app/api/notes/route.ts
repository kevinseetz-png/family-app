import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { noteSchema, noteUpdateSchema } from "@/lib/validation";
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
      .collection("notes")
      .where("familyId", "==", user.familyId)
      .limit(1000)
      .get();

    const notes = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate();
        return {
          id: doc.id,
          familyId: data.familyId,
          title: data.title,
          content: data.content,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: createdAt.toISOString(),
          _ts: createdAt.getTime(),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...n }) => n);

    return NextResponse.json({ notes });
  } catch (err) {
    console.error("Failed to fetch notes:", err);
    return NextResponse.json({ message: "Failed to fetch notes", notes: [] }, { status: 500 });
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

  const result = noteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { title, content } = result.data;

  const note = {
    familyId: user.familyId,
    title,
    content,
    createdBy: user.id,
    createdByName: user.name,
    createdAt: new Date(),
  };

  const docRef = await adminDb.collection("notes").add(note);

  return NextResponse.json({ id: docRef.id, ...note }, { status: 201 });
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

  const { id } = body as { id?: string };
  if (!id || id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const docRef = adminDb.collection("notes").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ message: "Note not found" }, { status: 404 });
  }

  if (doc.data()?.familyId !== user.familyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await docRef.delete();
  return NextResponse.json({ message: "Deleted" });
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

  const result = noteUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { id, title, content } = result.data;

  if (id.length > 128 || id.includes("/")) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const docRef = adminDb.collection("notes").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ message: "Note not found" }, { status: 404 });
  }

  if (doc.data()?.familyId !== user.familyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  await docRef.update({ title, content });

  return NextResponse.json({ message: "Updated" });
}
