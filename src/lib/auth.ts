import { SignJWT, jwtVerify } from "jose";
import type { User } from "@/types/auth";

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 1 day
const SALT_ROUNDS = 10;

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is required");

const secretKey = globalThis.Uint8Array.from(Buffer.from(secret, "utf-8"));

export { SALT_ROUNDS };

export async function createToken(user: User): Promise<string> {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    familyId: user.familyId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const id = payload.sub;
    const name = payload.name;
    const email = payload.email;
    const familyId = payload.familyId;
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof familyId !== "string"
    ) {
      return null;
    }
    const role = payload.role === "admin" ? "admin" as const : "member" as const;
    return { id, name, email, familyId, role };
  } catch {
    return null;
  }
}
