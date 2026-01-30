import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createInvite } from "@/lib/invites";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const invite = createInvite(user.id);
  return NextResponse.json({ code: invite.code }, { status: 201 });
}
