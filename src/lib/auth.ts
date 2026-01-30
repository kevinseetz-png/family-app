import { createHmac } from "crypto";
import type { User } from "@/types/auth";

const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const SALT_ROUNDS = 10;

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is required");

export { SALT_ROUNDS };

function base64url(input: string | Buffer): string {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b.toString("base64url");
}

export async function createToken(user: User): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      familyId: user.familyId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    })
  );
  const signature = base64url(
    createHmac("sha256", secret!).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = base64url(
      createHmac("sha256", secret!).update(`${header}.${payload}`).digest()
    );
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp === "number" && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    const id = data.sub;
    const name = data.name;
    const email = data.email;
    const familyId = data.familyId;
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof familyId !== "string"
    ) {
      return null;
    }
    return { id, name, email, familyId };
  } catch {
    return null;
  }
}
