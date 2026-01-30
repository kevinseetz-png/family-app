import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { authenticateUser } from "@/lib/users";
import { createToken } from "@/lib/auth";

// TODO: VULN-003 — Add rate limiting (infra-level concern)
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const user = await authenticateUser(result.data.email, result.data.password);
  if (!user) {
    return NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await createToken(user);
  const response = NextResponse.json({ user });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
