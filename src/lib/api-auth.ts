import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { User } from "@/types/auth";

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const user = await verifyToken(token);
  if (!user) {
    return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}
