import { SignJWT, jwtVerify } from "jose";
import type { User } from "@/types/auth";

const TOKEN_EXPIRY = "7d";
const SALT_ROUNDS = 10;

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is required");

function getSecret(): Uint8Array {
  return new TextEncoder().encode(secret);
}

export { SALT_ROUNDS };

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ sub: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = payload.sub;
    const name = payload.name;
    const email = payload.email;
    if (typeof id !== "string" || typeof name !== "string" || typeof email !== "string") {
      return null;
    }
    return { id, name, email };
  } catch {
    return null;
  }
}
