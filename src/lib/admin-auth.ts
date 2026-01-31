import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { User } from "@/types/auth";

export async function requireAdmin(request: NextRequest): Promise<User | NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return user;
}
