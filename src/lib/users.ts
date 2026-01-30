import bcrypt from "bcryptjs";
import type { User } from "@/types/auth";
import { SALT_ROUNDS } from "@/lib/auth";

interface StoredUser extends User {
  passwordHash: string;
}

// In-memory store — replace with a real database later
const users: StoredUser[] = [];

export function hasUsers(): boolean {
  return users.length > 0;
}

export function resetUsers(): void {
  users.length = 0;
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<User | null> {
  if (users.some((u) => u.email === email)) {
    return null;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
  };
  users.push(user);
  return { id: user.id, name: user.name, email: user.email };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = users.find((u) => u.email === email);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}
