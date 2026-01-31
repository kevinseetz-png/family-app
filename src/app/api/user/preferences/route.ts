import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { tabPreferencesSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";

const usersCol = () => adminDb.collection("users");

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const doc = await usersCol().doc(user.id).get();
  const data = doc.data();
  const visibleTabs = data?.visibleTabs ?? null;

  return NextResponse.json({ visibleTabs });
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

  const result = tabPreferencesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
  }

  await usersCol().doc(user.id).update({ visibleTabs: result.data.visibleTabs });

  return NextResponse.json({ visibleTabs: result.data.visibleTabs });
}
