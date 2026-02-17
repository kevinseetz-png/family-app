import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { picnicLoginSchema } from "@/lib/validation";
import { adminDb } from "@/lib/firebase-admin";
import { createPicnicClient } from "@/lib/picnic-client";
import { encrypt } from "@/lib/encryption";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = picnicLoginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { username, password } = result.data;

  const picnicClient = createPicnicClient();

  try {
    await picnicClient.login(username, password);
  } catch {
    return NextResponse.json(
      { message: "Picnic inloggegevens zijn onjuist" },
      { status: 401 }
    );
  }

  const authKey = picnicClient.authKey;
  if (!authKey) {
    return NextResponse.json(
      { message: "Picnic login mislukt" },
      { status: 401 }
    );
  }

  try {
    await adminDb.collection("picnic_connections").doc(user.familyId).set({
      authKey: encrypt(authKey),
      connectedBy: user.id,
      connectedByName: user.name,
      connectedAt: new Date(),
    });
  } catch {
    return NextResponse.json(
      { message: "Kon verbinding niet opslaan" },
      { status: 500 }
    );
  }

  return NextResponse.json({ connected: true });
}
