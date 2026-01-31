import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createInvite } from "@/lib/invites";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { familyId } = await request.json();
    if (!familyId || typeof familyId !== "string") {
      return NextResponse.json(
        { message: "familyId is required" },
        { status: 400 }
      );
    }

    const invite = await createInvite(authResult.id, familyId);
    const inviteUrl = `${request.nextUrl.origin}/register?invite=${invite.code}`;

    return NextResponse.json(
      { code: invite.code, inviteUrl },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "Failed to create invite" },
      { status: 500 }
    );
  }
}
