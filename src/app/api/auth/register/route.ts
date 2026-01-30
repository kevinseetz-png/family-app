import { NextRequest, NextResponse } from "next/server";
import { registerSchema, firstUserRegisterSchema } from "@/lib/validation";
import { createUser, hasUsers } from "@/lib/users";
import { createToken } from "@/lib/auth";
import { redeemInvite } from "@/lib/invites";

// TODO: VULN-003 — Add rate limiting (infra-level concern)
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const usersExist = hasUsers();
  const schema = usersExist ? registerSchema : firstUserRegisterSchema;
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  if (usersExist) {
    const inviteCode = (result.data as unknown as { inviteCode: string }).inviteCode;
    if (!redeemInvite(inviteCode)) {
      return NextResponse.json(
        { message: "Invalid or expired invite code" },
        { status: 403 }
      );
    }
  }

  const user = await createUser(
    result.data.name,
    result.data.email,
    result.data.password
  );

  if (!user) {
    return NextResponse.json(
      { message: "An account with this email already exists" },
      { status: 409 }
    );
  }
  const token = await createToken(user);
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
